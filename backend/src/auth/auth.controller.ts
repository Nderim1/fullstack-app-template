import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  Logger,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role, User as PrismaUser } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { NotImplementedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';

interface AuthenticatedRequest extends Request {
  user?: PrismaUser;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  private setJwtCookie(res: Response, accessToken: string) {
    const expiresInSeconds = this.configService.get<string>(
      'JWT_EXPIRES_IN_NUMERIC_SECONDS',
    );
    const maxAge = expiresInSeconds
      ? parseInt(expiresInSeconds, 10) * 1000
      : 3600 * 1000; // Default to 1 hour

    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
    });
  }

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    this.logger.log(`Received signup request for email: ${signUpDto.email}`);
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(
    @Req() req: any, // req is used by LocalAuthGuard to attach user
    @Body() _loginDto: LoginDto, // DTO is validated, but user comes from req.user
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: any }> {
    this.logger.log(`Login request for user: ${req.user.email}`);
    // req.user is populated by LocalAuthGuard after successful validation
    const { accessToken, user } = await this.authService.generateJwt(req.user);
    this.setJwtCookie(res, accessToken);
    this.logger.log(`User ${user.email} logged in successfully.`);
    return { accessToken, user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Post('magic-link/request')
  async requestMagicLink(@Body() magicLinkRequestDto: MagicLinkRequestDto) {
    this.logger.log(
      `Received magic link request for email: ${magicLinkRequestDto.email}`,
    );
    await this.authService.requestMagicLink(magicLinkRequestDto);
    return {
      message:
        'If an account with this email exists, a magic link has been sent.',
    };
  }

  @Get('magic-link/verify')
  async verifyMagicLinkGet(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(
      `Verifying magic link via GET for token: ${token.substring(0, 10)}...`,
    );
    try {
      throw new NotImplementedException(
        'Magic link verification via GET is not fully implemented due to missing email.',
      );
    } catch (error) {
      this.logger.error(
        `Magic link GET verification failed for token: ${token.substring(0, 10)}...`,
        error,
      );
      const errorPageUrl = `${
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173'
      }/auth/error?message=Invalid or expired magic link`;
      return res.redirect(errorPageUrl);
    }
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLinkPost(
    @Body() verifyMagicLinkDto: VerifyMagicLinkDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: any }> {
    this.logger.log(
      `Verifying magic link for token: ${verifyMagicLinkDto.token}`,
    );
    const { accessToken, user } =
      await this.authService.verifyMagicLink(verifyMagicLinkDto);
    this.setJwtCookie(res, accessToken);
    this.logger.log(`Magic link verified for user ${user.email}.`);
    return { accessToken, user };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any): Promise<any> {
    this.logger.log(`Profile requested for user: ${req.user.email}`);
    // To ensure we have the most up-to-date user information, re-fetch from DB
    // This is especially important if user details can be changed by other processes
    const freshUser = await this.userService.findById(req.user.id);
    if (!freshUser) {
      this.logger.warn(
        `User ${req.user.id} not found in DB during profile retrieval.`,
      );
      throw new UnauthorizedException('User not found');
    }
    return freshUser;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminResource(@Req() req: AuthenticatedRequest) {
    this.logger.log(`Admin resource accessed by: ${req.user?.email}`);
    return { message: 'This is an admin-only resource.', user: req.user };
  }

  // --- Google OAuth --- 
  @Get('google')
  @UseGuards(GoogleOAuthGuard) 
  async googleAuth(@Req() req) {
    this.logger.log('Initiating Google OAuth flow.');
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard) 
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) response: Response) {
    this.logger.log(`Google OAuth callback successful for user: ${req.user?.email}`);
    if (!req.user) {
      this.logger.error('Google OAuth callback did not result in a user object.');
      response.status(HttpStatus.UNAUTHORIZED).redirect('/auth/login?error=google_oauth_failed'); 
      return;
    }

    const { accessToken, user } = await this.authService.generateJwt(req.user as PrismaUser);
    
    const frontendUrl = this.authService.getFrontendUrl(); 
    // Redirect to /auth/callback/:provider with token, e.g., /auth/callback/google?token=...
    response.redirect(`${frontendUrl}/auth/callback/google?token=${accessToken}`);
  }

  // --- GitHub OAuth Routes ---
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    this.logger.log('Initiating GitHub OAuth flow.');
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log('GitHub OAuth callback received');
    if (!req.user) {
      this.logger.error('GitHub OAuth: No user found in request');
      const errorPageUrl = `${
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
      }/auth?error=github_oauth_failed`;
      return res.redirect(errorPageUrl);
    }
    
    this.logger.log(`GitHub OAuth user: ${req.user.email}`);
    const user = await this.authService.findOrCreateUserForOAuth(
      'github',
      req.user.providerId,
      req.user.email,
      req.user.name,
      req.user.avatarUrl,
    );
    
    const { accessToken } = await this.authService.generateJwt(user);
    this.setJwtCookie(res, accessToken);
    this.logger.log(`JWT set for GitHub OAuth user: ${user.email}`);
    
    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/callback/github?token=${accessToken}`);
  }
}
