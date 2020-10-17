import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AliasDto } from '../dto/alias.dto';
import { Attribute, Change, Client } from 'ldapts';
import { AccountInvalidError } from '../errors/account-invalid.error';
import { Entry } from 'ldapts/messages';
import { Configuration } from '../configuration';
import * as winston from 'winston';
import { AliasAlreadyExistsError } from '../errors/alias-already-exists.error';
import { AliasDoesNotExistError } from '../errors/alias-does-not-exist.error';

/**
 * Alias and account modification service
 */
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

  /**
   * Bind to ldap server
   * @private
   */
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

  /**
   * Fetch account object from ldap server
   * @param username Username of account
   */
  async _getAccount(username: string): Promise<Entry> {
    await this._bind();
    winston.info(`Getting account ${username}`);

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

  /**
   * Retrieve all aliases of user
   * @param username User account
   * @param filter Filter to search for aliases
   */
  async getAliases(username: string, filter = ''): Promise<AliasDto[]> {
    const account = await this._getAccount(username);
    let aliases = account[this._configService.get('AM_LDAP_ALIAS_ATTR')] as
      | string
      | string[];
    if (aliases === undefined) {
      return [];
    }
    if (!(aliases instanceof Array)) {
      aliases = [aliases];
    }
    return aliases
      .filter(alias => alias.match(new RegExp(`^.*${filter}.*$`)))
      .map(alias => {
        return { address: alias };
      });
  }

  /**
   * Add a new alias to the account
   * @param username Account name
   * @param alias Alias to add
   */
  async createAlias(username: string, alias: AliasDto): Promise<AliasDto> {
    winston.info(`Adding ${alias.address} to user ${username}`);
    winston.info('Checking for duplicates');
    if ((await this.getAliases(username, alias.address)).length > 0) {
      throw new AliasAlreadyExistsError(username, alias);
    }
    const account = await this._getAccount(username);

    winston.info('Adding alias');
    await this._client.modify(
      account.dn,
      new Change({
        operation: 'add',
        modification: new Attribute({
          type: this.configService.get('AM_LDAP_ALIAS_ATTR'),
          values: [alias.address],
        }),
      }),
    );

    return alias;
  }

  /**
   * Change an alias
   * @param username The user to modify
   * @param address The original alias
   * @param newAlias The new alias
   */
  async updateAlias(
    username: string,
    address: string,
    newAlias: AliasDto,
  ): Promise<AliasDto> {
    winston.info(
      `Changing ${address} to ${newAlias.address} for user ${username}`,
    );
    winston.info('Getting existing aliases');
    const aliases = await this.getAliases(username);
    if (!aliases.some(alias => alias.address === address)) {
      throw new AliasDoesNotExistError(username, address);
    }
    if (aliases.some(alias => alias.address === newAlias.address)) {
      throw new AliasAlreadyExistsError(username, newAlias);
    }
    const account = await this._getAccount(username);

    winston.info('Changing alias');
    await this._client.modify(account.dn, [
      new Change({
        operation: 'delete',
        modification: new Attribute({
          type: this.configService.get('AM_LDAP_ALIAS_ATTR'),
          values: [address],
        }),
      }),

      new Change({
        operation: 'add',
        modification: new Attribute({
          type: this.configService.get('AM_LDAP_ALIAS_ATTR'),
          values: [newAlias.address],
        }),
      }),
    ]);

    return newAlias;
  }

  /**
   * Delete an alias
   * @param username Account to modify
   * @param address Alias to delete
   */
  async deleteAlias(username: string, address: string): Promise<void> {
    winston.info(`Deleting ${address} from user ${username}`);
    if ((await this.getAliases(username, address)).length == 0) {
      throw new AliasDoesNotExistError(username, address);
    }

    const account = await this._getAccount(username);

    winston.info('Deleting alias');
    await this._client.modify(
      account.dn,
      new Change({
        operation: 'delete',
        modification: new Attribute({
          type: this.configService.get('AM_LDAP_ALIAS_ATTR'),
          values: [address],
        }),
      }),
    );
  }
}
