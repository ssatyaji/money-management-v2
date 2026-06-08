import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.refreshSecret');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret || 'fallback-refresh-secret',
      passReqToCallback: true,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  validate(request: Request, payload: { sub: string; email: string; role: string }) {
    const refreshToken =
      request?.cookies?.refresh_token ||
      request?.headers?.authorization?.replace('Bearer ', '');

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
