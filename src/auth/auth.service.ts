import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from '../dto/token.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(username: string): TokenDto {
    return {
      token: this.jwtService.sign({
        username: username,
      }),
    };
  }
}
