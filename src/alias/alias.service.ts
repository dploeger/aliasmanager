import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alias } from '../schemas/alias';
import { Attribute, Change, Client } from 'ldapts';
import { AccountInvalidError } from '../errors/account-invalid.error';
import { Entry } from 'ldapts/messages';
import { Configuration } from '../configuration';
import * as winston from 'winston';
import { AliasAlreadyExistsError } from '../errors/alias-already-exists.error';
import { AliasDoesNotExistError } from '../errors/alias-does-not-exist.error';
import { Results } from '../schemas/results';

/**
 * Alias and account modification service
 */
@Injectable()
export class AliasService {
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
  async getAliases(
    username: string,
    filter = '',
    page = 1,
    pageSize = null,
    strict = false,
  ): Promise<Results<Alias>> {
    if (!pageSize) {
      pageSize = parseInt(this._configService.get('AM_DEFAULT_PAGESIZE'));
    }
    winston.debug(`Searching for alias with filter "${filter}"`);
    const account = await this._getAccount(username);
    let aliases = account[this._configService.get('AM_LDAP_ALIAS_ATTR')] as
      | string
      | string[];
    if (aliases === undefined) {
      return {
        page: page,
        pageSize: pageSize,
        total: 0,
        results: [],
      };
    }
    if (!(aliases instanceof Array)) {
      aliases = [aliases];
    }
    const results = aliases
      .sort((a, b): number => {
        return ('' + a).localeCompare(b);
      })
      .filter(alias => {
        if (strict) {
          return alias === filter;
        } else {
          return alias.match(new RegExp(`^.*${filter}.*$`));
        }
      })
      .map(alias => {
        return { address: alias };
      });

    winston.debug(
      `Returning page ${page} of ${results.length} results with a page size of ${pageSize}`,
    );
    return {
      pageSize: pageSize,
      page: page,
      total: results.length,
      results: results.slice((page - 1) * pageSize, page * pageSize),
    };
  }

  /**
   * Add a new alias to the account
   * @param username Account name
   * @param alias Alias to add
   */
  async createAlias(username: string, alias: Alias): Promise<Alias> {
    winston.info(`Adding ${alias.address} to user ${username}`);
    winston.info('Checking for duplicates');
    if (
      (await this.getAliases(username, alias.address, 1, null, true)).total > 0
    ) {
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
    newAlias: Alias,
  ): Promise<Alias> {
    winston.info(
      `Changing ${address} to ${newAlias.address} for user ${username}`,
    );
    winston.info('Getting existing aliases');
    if ((await this.getAliases(username, address, 1, null, true)).total === 0) {
      throw new AliasDoesNotExistError(username, address);
    }
    if (
      (await this.getAliases(username, newAlias.address, 1, null, true))
        .total === 1
    ) {
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
    if ((await this.getAliases(username, address, 1, null, true)).total == 0) {
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
