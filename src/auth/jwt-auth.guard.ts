import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * An authentication guard for JWT secured endpoints
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
