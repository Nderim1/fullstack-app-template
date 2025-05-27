import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'], // Request user's primary email address
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string, // GitHub usually provides this
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { username, emails, id: providerId, displayName } = profile;
    // GitHub emails can be complex: primary might not be in emails array directly if private.
    // The 'user:email' scope should make it available.
    const email = emails?.[0]?.value;

    if (!email) {
      this.logger.error(
        'GitHub profile did not return an email. Ensure your GitHub email is public or you granted email scope.',
      );
      return done(
        new Error(
          'GitHub profile did not return an email. Please ensure your GitHub email is verified and accessible.',
        ),
        false,
      );
    }

    this.logger.log(
      `GitHub OAuth: Processing user ${email}, providerId: ${providerId}`,
    );

    // GitHub might not provide separate first/last names, displayName or username can be used.
    const nameParts = displayName?.split(' ') || [username];
    const firstName = nameParts[0];
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    try {
      const serviceProfile = {
        id: providerId,
        emails: emails,
        displayName: displayName || username, // Use username if displayName is not available
        name: {
          givenName: firstName,
          familyName: lastName,
        },
      };

      const { user } = await this.authService.findOrCreateUserFromProvider(
        'github',
        serviceProfile,
      );
      done(null, user);
    } catch (error) {
      this.logger.error(
        `Error validating GitHub user ${email}: ${error.message}`,
        error.stack,
      );
      done(error, false);
    }
  }
}
