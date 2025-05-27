import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can override handleRequest to customize error handling or response
  handleRequest(err, user, info) {
    if (err || !user) {
      // Log the error or info for debugging if needed
      // console.error('JWT Auth Error:', err, 'Info:', info);
      throw (
        err ||
        new UnauthorizedException(info?.message || 'User is not authenticated')
      );
    }
    return user;
  }
}
