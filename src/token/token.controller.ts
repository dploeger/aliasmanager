import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LdapAuthGuard } from '../auth/ldap-auth.guard';
import { ApiBasicAuth } from '@nestjs/swagger';

@Controller('api/token')
export class TokenController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(LdapAuthGuard)
  @ApiBasicAuth()
  async getToken(@Request() req) {
    return this.authService.login(req.user);
  }
}
