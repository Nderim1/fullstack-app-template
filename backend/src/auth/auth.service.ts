import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtPayload } from './strategies/jwt.strategy';

const saltRounds = 10;

interface ProviderProfile {
  id: string; // Provider-specific user ID
  emails?: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  name?: { familyName?: string; givenName?: string };
  // Add other fields as needed, e.g., photos
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async generateJwt(user: User): Promise<{ accessToken: string; user: User }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
    this.logger.log(
      `Generated JWT for user ${user.email} (ID: ${user.id}, Role: ${user.role})`,
    );
    return { accessToken, user };
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; user: User }> {
    const { email, password, name } = signUpDto;
    this.logger.log(`Processing signup for email: ${email}`);

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`User with email ${email} already exists.`);
      throw new ConflictException('User with this email already exists.');
    }

    try {
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const user = await this.userService.createUserInternal({
        email,
        passwordHash,
        name,
        role: Role.USER,
      });
      this.logger.log(`User ${email} signed up successfully.`);
      return this.generateJwt(user);
    } catch (error) {
      this.logger.error(
        `Error during sign up for ${email}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not create user. Please try again.',
      );
    }
  }

  /**
   * Validates a user's credentials (email and password).
   * Called by LocalStrategy.
   * @param email The user's email.
   * @param passwordInput The password provided by the user.
   * @returns The user object if credentials are valid, otherwise null.
   */
  async validateUser(
    email: string,
    passwordInput: string,
  ): Promise<User | null> {
    this.logger.log(`Validating credentials for email: ${email}`);
    const user = await this.userService.findByEmail(email);

    if (!user || !user.passwordHash) {
      this.logger.warn(
        `Validation failed for ${email}: User not found or no password set.`,
      );
      return null; // User not found or no password hash to compare against
    }

    const isPasswordMatching = await bcrypt.compare(
      passwordInput,
      user.passwordHash,
    );

    if (!isPasswordMatching) {
      this.logger.warn(`Validation failed for ${email}: Invalid password.`);
      return null; // Passwords do not match
    }

    this.logger.log(`Credentials validated successfully for ${email}.`);
    // Exclude passwordHash from the returned user object for security, though LocalStrategy will do this too.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result as User; // Return the user object (without passwordHash)
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: User }> {
    const { email, password } = loginDto;
    this.logger.log(`Processing login for email: ${email}`);

    const user = await this.validateUser(email, password);

    if (!user) {
      this.logger.warn(
        `Login attempt failed for ${email}: Invalid credentials after validation.`,
      );
      throw new UnauthorizedException('Invalid credentials.');
    }

    this.logger.log(`User ${email} logged in successfully after validation.`);
    // The user object from validateUser already has passwordHash excluded
    return this.generateJwt(user);
  }

  async requestMagicLink(
    magicLinkRequestDto: MagicLinkRequestDto,
  ): Promise<{ message: string }> {
    const { email } = magicLinkRequestDto;
    this.logger.log(`Requesting magic link for email: ${email}`);

    let user = await this.userService.findByEmail(email);

    if (!user) {
      this.logger.log(
        `Magic link request for new user email: ${email}. Creating user.`,
      );
      try {
        // Create a new user if one doesn't exist
        user = await this.userService.createUserInternal({
          email,
          role: Role.USER, // Default role
        });
        this.logger.log(`User ${email} created successfully via magic link flow.`);
      } catch (error) {
        this.logger.error(
          `Error creating user ${email} during magic link signup: ${error.message}`,
          error.stack,
        );
        // Still return a generic message to avoid leaking information
        return {
          message:
            'If an account with this email is registered or can be created, a magic link has been sent.',
        };
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.userService.createMagicLink(user.id, token, expiresAt);

    try {
      await this.emailService.sendMagicLinkEmail(email, token);
      this.logger.log(`Magic link sent to ${email}.`);
      return {
        message: 'Magic link sent. If your email is registered, you will receive a link to log in.',
      };
    } catch (error) {
      this.logger.error(
        `Failed to send magic link email to ${email}: ${error.message}`,
        error.stack,
      );
      return {
        message: 'Magic link sent. If your email is registered, you will receive a link to log in.',
      };
    }
  }

  getFrontendUrl(): string {
    const url = this.configService.get<string>('FRONTEND_URL');
    if (!url) {
      this.logger.error('FRONTEND_URL is not set in environment variables.');
      // Fallback or throw an error, depending on desired behavior
      // For now, let's throw an error to make it explicit during development
      throw new Error('FRONTEND_URL environment variable is not configured.');
    }
    return url;
  }

  async verifyMagicLink(
    verifyMagicLinkDto: VerifyMagicLinkDto,
  ): Promise<{ accessToken: string; user: User }> {
    const { email, token } = verifyMagicLinkDto;
    this.logger.log(
      `Verifying magic link for email: ${email}, token: ${token.substring(
        0,
        10,
      )}...`,
    );

    const magicLinkWithUser =
      await this.userService.findByMagicLinkToken(token);

    if (!magicLinkWithUser || magicLinkWithUser.user.email !== email) {
      this.logger.warn(
        `Invalid or expired magic link attempt for email: ${email}, token: ${token.substring(
          0,
          10,
        )}...`,
      );
      throw new UnauthorizedException('Invalid or expired magic link.');
    }

    await this.userService.markMagicLinkAsUsed(magicLinkWithUser.id);

    this.logger.log(
      `Magic link verified for user ${magicLinkWithUser.user.email}.`,
    );

    return this.generateJwt(magicLinkWithUser.user);
  }

  async findOrCreateUserFromProvider(
    providerName: string,
    profile: ProviderProfile,
  ): Promise<{ accessToken: string; user: User }> {
    this.logger.log(
      `Processing OAuth user from ${providerName} with provider ID: ${profile.id}`,
    );

    const providerEmail = profile.emails?.[0]?.value;
    if (!providerEmail) {
      this.logger.error(
        `No email found in ${providerName} profile for provider ID: ${profile.id}`,
      );
      throw new InternalServerErrorException(
        'Could not retrieve email from provider.',
      );
    }

    // 1. Check if user exists with this provider and providerId
    let user = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: providerName,
          providerId: profile.id,
        },
      },
    });

    if (user) {
      this.logger.log(`User found with ${providerName} ID: ${profile.id}`);
      return this.generateJwt(user);
    }

    // 2. If not, check if user exists with this email
    user = await this.userService.findByEmail(providerEmail);

    if (user) {
      // User exists with this email but hasn't linked this provider yet.
      // Link the provider to the existing account.
      this.logger.log(
        `User with email ${providerEmail} found. Linking ${providerName} ID: ${profile.id}`,
      );
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: providerName,
          providerId: profile.id,
          // Optionally update name if it's missing or different
          name:
            user.name ||
            profile.displayName ||
            `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
        },
      });
      return this.generateJwt(user);
    }

    // 3. If no user exists with this email, create a new user.
    this.logger.log(
      `No user found with email ${providerEmail}. Creating new user with ${providerName} ID: ${profile.id}`,
    );
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: providerEmail,
          name:
            profile.displayName ||
            `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
            'User',
          provider: providerName,
          providerId: profile.id,
          role: Role.USER, // Default role
          // passwordHash will be null for OAuth-only users initially
        },
      });
      this.logger.log(
        `New user created for ${providerEmail} via ${providerName}.`,
      );
      return this.generateJwt(newUser);
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation
        this.logger.error(
          `Unique constraint violation for ${providerEmail} or ${providerName}-${profile.id}: ${error.message}`,
        );
        throw new ConflictException(
          'User with this email or provider ID already exists.',
        );
      }
      this.logger.error(
        `Error creating user for ${providerEmail} via ${providerName}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not create user from provider. Please try again.',
      );
    }
  }

  async validateUserFromJwt(payload: JwtPayload): Promise<User | null> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token: User not found.');
    }
    return user;
  }

  async findOrCreateUserForOAuth(
    provider: string,
    providerAccountId: string,
    email: string,
    name?: string,
    avatarUrl?: string,
  ): Promise<User> {
    const account = await this.prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    if (account) {
      this.logger.log(
        `User found via account: ${account.user.email} (Provider: ${provider})`,
      );
      const updateData: Partial<User> = {};
      if (name && account.user.name !== name) updateData.name = name;
      if (avatarUrl && account.user.avatarUrl !== avatarUrl)
        updateData.avatarUrl = avatarUrl;
      if (Object.keys(updateData).length > 0) {
        await this.userService.updateUser(account.user.id, updateData);
      }
      const updatedUser = await this.userService.findById(account.userId);
      if (!updatedUser) {
        this.logger.error(
          `OAuth: User ${account.userId} not found after fetching linked account.`,
        );
        throw new InternalServerErrorException(
          'User account inconsistency after OAuth.',
        );
      }
      return updatedUser;
    }

    let existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      this.logger.log(
        `Existing user ${email} found. Linking account (Provider: ${provider}).`,
      );
      const updateData: Partial<User> = {};
      if (name && !existingUser.name) updateData.name = name;
      if (avatarUrl && !existingUser.avatarUrl)
        updateData.avatarUrl = avatarUrl;
      if (Object.keys(updateData).length > 0) {
        existingUser = await this.userService.updateUser(
          existingUser.id,
          updateData,
        );
      }
    } else {
      existingUser = await this.userService.createUserInternal({
        email,
        name,
        avatarUrl,
        role: Role.USER,
      });
      this.logger.log(`New user created from provider ${provider}.`);
    }

    await this.prisma.account.create({
      data: {
        userId: existingUser.id,
        provider,
        providerAccountId,
      },
    });
    this.logger.log(
      `Account linked for user ${existingUser.email} with provider ${provider}.`,
    );
    return existingUser;
  }
}
