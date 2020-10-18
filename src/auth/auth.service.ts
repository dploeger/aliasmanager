import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../token/token';
import * as winston from 'winston';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(username: string): Token {
    winston.debug(`Signing JWT token for user ${username}`);
    return {
      token: this.jwtService.sign({
        username: username,
      }),
    };
  }
}
