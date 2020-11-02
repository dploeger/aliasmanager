import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../configuration';
import { IncomingMessage } from 'http';
import { parse } from 'cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Configuration>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: IncomingMessage) => {
          if ('cookie' in req.headers) {
            const cookies = parse(req.headers.cookie);
            if (configService.get('AM_TOKEN_COOKIE') in cookies) {
              return cookies[configService.get('AM_TOKEN_COOKIE')];
            }
          }
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('AM_CRYPTO_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { username: payload.username };
  }
}
