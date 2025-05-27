import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service'; // To handle user creation/linking

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService, // Inject AuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'], // Request email and basic profile information
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string, // May not be provided by Google depending on config
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id: providerId } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      this.logger.error('Google profile did not return an email.');
      // It's important to call done with an error in this case
      return done(
        new Error(
          'Google profile did not return an email. Please ensure your Google account has a primary email.',
        ),
        false,
      );
    }

    this.logger.log(
      `Google OAuth: Processing user ${email}, providerId: ${providerId}`,
    );

    try {
      // Construct the profile object expected by AuthService
      const serviceProfile = {
        id: providerId, // from const { ..., id: providerId } = profile;
        emails: emails, // from const { ..., emails, ... } = profile;
        displayName: profile.displayName, // from passport's Profile type
        name: name, // from const { name, ... } = profile;
      };

      const { user } = await this.authService.findOrCreateUserFromProvider(
        'google',
        serviceProfile,
      );
      // The user object returned by findOrCreateUserFromProvider includes accessToken and user.
      // Passport's done callback expects the user object that will be set on req.user.
      done(null, user);
    } catch (error) {
      this.logger.error(
        `Error validating Google user ${email}: ${error.message}`,
        error.stack,
      );
      done(error, false);
    }
  }
}
