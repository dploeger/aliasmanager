import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { LdapAuthGuard } from './ldap-auth.guard';
import {
  ApiBasicAuth,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Token } from '../token/token';
import { Error } from '../errors/error';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('login')
  @UseGuards(LdapAuthGuard)
  @ApiBasicAuth()
  @ApiOkResponse({
    description: 'Returned the token to use for token endpoints',
    type: Token,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error',
    type: Error,
  })
  @ApiOperation({
    summary:
      'Authenticate and create a JWT token. Return it as body and inside a httponly cookie',
  })
  async login(@Req() req: Request, @Res() res: Response) {
    const token = await this.authService.login(req.user as string);
    res
      .cookie(this.configService.get('AM_TOKEN_COOKIE'), token.token, {
        httpOnly: true,
        maxAge: parseInt(this.configService.get('AM_TOKEN_MAXAGE')),
      })
      .send(token);
  }

  @Get('logout')
  @ApiCookieAuth()
  @ApiNoContentResponse({
    description: 'Cookie was cleaned',
  })
  @ApiOperation({
    summary: 'Remove the token cookie resulting in logging out.',
  })
  async logout(@Req() req: Request, @Res() res: Response) {
    res
      .clearCookie(this.configService.get('AM_TOKEN_COOKIE'))
      .status(204)
      .send();
  }
}
