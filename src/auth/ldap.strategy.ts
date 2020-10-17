import * as Strategy from 'passport-ldapauth';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Configuration } from '../configuration';
import { IncomingMessage } from 'http';

@Injectable()
export class LdapStrategy extends PassportStrategy(Strategy) {
  private _configService: ConfigService;
  constructor(configService: ConfigService<Configuration>) {
    super({
      server: {
        url: configService.get('AM_LDAP_URL'),
        bindDN: configService.get('AM_LDAP_BIND_DN'),
        bindCredentials: configService.get('AM_LDAP_BIND_PW'),
        searchBase: configService.get('AM_LDAP_USER_DN'),
        searchFilter: `${configService.get('AM_LDAP_USER_ATTR')}={{username}}`,
      },
      credentialsLookup: (request: IncomingMessage) => {
        const credentials = Buffer.from(
          request.headers.authorization.split(' ')[1],
          'base64',
        ).toString('ascii');
        return {
          username: credentials.split(':')[0],
          password: credentials.split(':')[1],
        };
      },
    });
    this._configService = configService;
  }
  async validate(user: object): Promise<string> {
    return user[this._configService.get('AM_LDAP_USER_ATTR')];
  }
}
