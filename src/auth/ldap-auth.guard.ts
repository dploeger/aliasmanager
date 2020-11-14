import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * An AuthGuard for LDAP authenticated endpoints
 */
@Injectable()
export class LdapAuthGuard extends AuthGuard('ldapauth') {}
