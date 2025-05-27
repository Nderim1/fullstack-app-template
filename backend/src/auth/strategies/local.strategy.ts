import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // We use email as the username
      // passwordField: 'password' // this is the default
    });
  }

  async validate(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`LocalStrategy: Validating user ${email}`);
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      this.logger.warn(
        `LocalStrategy: Authentication failed for user ${email}`
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`LocalStrategy: User ${email} authenticated successfully`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user; // Exclude passwordHash from the returned user object
    return result;
  }
}
