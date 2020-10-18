import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LdapAuthGuard } from '../auth/ldap-auth.guard';
import {
  ApiBasicAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Error } from '../errors/error';
import { Token } from './token';

/**
 * A controller for generating authentication tokens
 */
@Controller('api/token')
export class TokenController {
  constructor(private authService: AuthService) {}

  @Get()
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
  @ApiOperation({ summary: 'Authenticate and create a JWT token' })
  async getToken(@Request() req): Promise<Token> {
    return this.authService.login(req.user);
  }
}
