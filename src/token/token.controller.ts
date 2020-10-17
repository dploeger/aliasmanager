import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { HttpAuthGuard } from '../auth/http-auth.guard';
import { ApiBasicAuth, ApiSecurity } from '@nestjs/swagger';

@Controller('api/token')
export class TokenController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(HttpAuthGuard)
  @ApiBasicAuth()
  async getToken(@Request() req) {
    return this.authService.login(req.user);
  }
}
