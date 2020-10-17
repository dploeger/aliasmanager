import * as Strategy from 'passport-ldapauth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Configuration } from '../configuration';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Configuration>) {
    super({
      server: {
        url: configService.get('AM_LDAP_URL'),
        bindDN: configService.get('AM_LDAP_BIND_DN'),
        bindCredentials: configService.get('AM_LDAP_BIND_PW'),
        searchBase: configService.get('AM_LDAP_USER_DN'),
        searchFilter: `${configService.get('AM_LDAP_USER_ATTR')}={{username}}`,
      },
    });
  }
}
