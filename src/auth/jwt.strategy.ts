import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../configuration';
import { IncomingMessage } from 'http';
import { parse } from 'cookie';

/**
 * A passport strategy for handling JWTs
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Configuration>) {
    super({
      // extract tokens from either the cookie or bearer request
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

  /**
   * Extract neccessary information from the JWT payload
   * @param payload the JWT payload
   */
  async validate(payload: any) {
    return { username: payload.username };
  }
}
