import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AliasDto } from '../dto/alias.dto';
import { Client } from 'ldapts';
import { AccountInvalidError } from '../errors/account-invalid.error';
import { Entry } from 'ldapts/messages';
import { Configuration } from '../configuration';
import { CantConnectToLdapError } from '../errors/cant-connect-to-ldap.error';
import * as winston from 'winston';

@Injectable()
export class AccountService {
  private _client: Client;
  private _configService: ConfigService;
  private _bound: boolean;

  constructor(private configService: ConfigService<Configuration>) {
    this._configService = configService;
    const ldapUrl = configService.get('AM_LDAP_URL');
    winston.info(`Connecting to LDAP service on ${ldapUrl}`);
    this._client = new Client({
      url: ldapUrl,
    });
  }

  private async _bind() {
    if (!this._bound) {
      const bindDn = this.configService.get('AM_LDAP_BIND_DN');
      winston.info(`Binding to ldap service with dn ${bindDn}`);
      await this._client.bind(
        bindDn,
        this.configService.get('AM_LDAP_BIND_PW'),
      );
      this._bound = true;
    }
  }

  async _getAccount(username: string): Promise<Entry> {
    await this._bind();

    const filter = `(${this._configService.get(
      'AM_LDAP_USER_ATTR',
    )}=${username})`;
    const baseDn = this._configService.get('AM_LDAP_USER_DN');

    winston.debug(`Searching on LDAP service for ${filter} on ${baseDn}`);
    const results = await this._client.search(baseDn, {
      scope: 'sub',
      filter: filter,
    });

    if (results.searchEntries.length != 1) {
      throw new AccountInvalidError(username);
    }
    return results.searchEntries[0];
  }

  async getAliases(username: string, filter = ''): Promise<AliasDto[]> {
    const account = await this._getAccount(username);
    let aliases = account[this._configService.get('AM_LDAP_ALIAS_ATTR')] as
      | string
      | string[];
    if (!(aliases instanceof Array)) {
      aliases = [aliases];
    }
    return aliases
      .filter(alias => alias.match(new RegExp(`^.*${filter}.*$`)))
      .map(alias => {
        return { address: alias };
      });
  }

  async createAlias(username: string, alias: AliasDto): Promise<AliasDto[]> {
    return null;
  }

  async updateAlias(
    username: string,
    address: string,
    newAlias: AliasDto,
  ): Promise<void> {
    return null;
  }

  async deleteAlias(username: string, address: string): Promise<void> {
    return null;
  }
}
