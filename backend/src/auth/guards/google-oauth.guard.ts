import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  // Optional: You can override canActivate or handleRequest for custom logic
  // For example, to handle how the redirect happens or to set session properties.
  // By default, it will redirect to Google for the 'google' strategy.
  // On callback, it will invoke the GoogleStrategy's validate method.

  // If you want to store the JWT in a session after successful OAuth,
  // you might need to handle that in the strategy or controller, as Passport
  // by default doesn't create a session unless configured (e.g., app.use(session(...)))
  // and strategy's `super` call includes `session: true`.
  // For JWT-based auth (common in SPAs), we typically issue our own JWT after OAuth.
}
