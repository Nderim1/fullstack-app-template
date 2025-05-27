import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User, Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // Standard JWT subject claim, we'll use user ID
  email: string;
  role: Role;
  // Add any other fields you want in the JWT payload
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // The payload is the decoded JWT. We use 'sub' (subject) for user ID.
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid.');
    }
    // Optionally, you can do more checks here, e.g., if the user is active
    // The user object returned here will be available as `req.user` in protected routes
    return user;
  }
}
