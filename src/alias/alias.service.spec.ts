import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from './alias.service';
import { ConfigModule } from '@nestjs/config';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import * as winston from 'winston';
import { setupLogger } from '../../test/setup-logger';
import { AliasDoesNotExistError } from '../errors/alias-does-not-exist.error';
import { AliasAlreadyExistsError } from '../errors/alias-already-exists.error';
import { AccountInvalidError } from '../errors/account-invalid.error';
import set = Reflect.set;

describe('AccountService', () => {
  let service: AliasService;
  let setupError = false;

  beforeEach(async () => {
    setupLogger();
    let ldapUrl;
    try {
      ldapUrl = await startContainer();
    } catch (e) {
      winston.error(`Error starting ldap container: ${e.message}`);
      setupError = true;
      return;
    }
    winston.info('Creating Testmodule');
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => {
              return {
                AM_LDAP_URL: ldapUrl,
                AM_LDAP_BIND_DN: 'cn=admin,dc=example,dc=com',
                AM_LDAP_BIND_PW: 'admin',
                AM_LDAP_USER_DN: 'dc=example,dc=com',
                AM_LDAP_USER_ATTR: 'uid',
                AM_LDAP_ALIAS_ATTR: 'registeredAddress',
                AM_DEFAULT_PAGESIZE: '10',
              };
            },
          ],
        }),
      ],
      providers: [AliasService],
    }).compile();

    service = module.get<AliasService>(AliasService);
  });

  afterEach(async () => {
    await stopContainer();
  });

  it('should be defined', () => {
    expect(setupError).toBeFalsy();
    expect(service).toBeDefined();
  });

  it('should return all aliases', async () => {
    expect(setupError).toBeFalsy();
    const aliases = await service.getAliases('user');
    expect(aliases).toStrictEqual({
      pageSize: 10,
      page: 1,
      total: 1,
      results: [{ address: 'alias1.user@example.com' }],
    });
  });

  it('should throw when giving a non existent user', async () => {
    expect(setupError).toBeFalsy();
    try {
      await service.getAliases('unknown');
    } catch (e) {
      expect(e.name).toEqual(AccountInvalidError.NAME);
    }
  });

  it('should create a new alias', async () => {
    expect(setupError).toBeFalsy();
    let aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(1);
    const newAlias = await service.createAlias('user', {
      address: 'alias2.user@example.com',
    });
    expect(newAlias).not.toBeNull();
    expect(newAlias).toStrictEqual({
      address: 'alias2.user@example.com',
    });
    aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(2);
    expect(aliases.results[1]).toStrictEqual({
      address: 'alias2.user@example.com',
    });
  });

  it('should update an alias', async () => {
    expect(setupError).toBeFalsy();
    let aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(1);
    const updatedAlias = await service.updateAlias(
      'user',
      'alias1.user@example.com',
      {
        address: 'alias2.user@example.com',
      },
    );
    expect(updatedAlias).not.toBeNull();
    expect(updatedAlias).toStrictEqual({
      address: 'alias2.user@example.com',
    });
    aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(1);
    expect(aliases.results[0]).toStrictEqual({
      address: 'alias2.user@example.com',
    });
  });

  it('should delete an alias', async () => {
    expect(setupError).toBeFalsy();
    let aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(1);
    await service.deleteAlias('user', 'alias1.user@example.com');
    aliases = await service.getAliases('user');
    expect(aliases.total).toEqual(0);
  });

  it('should refuse adding an already existing alias', async () => {
    expect(setupError).toBeFalsy();
    try {
      await service.createAlias('user', {
        address: 'alias1.user@example.com',
      });
    } catch (e) {
      expect(e.name).toEqual(AliasAlreadyExistsError.NAME);
    }
  });

  it('should refuse changing an alias that does not exist', async () => {
    expect(setupError).toBeFalsy();
    try {
      await service.updateAlias('user', 'notexists@example.com', {
        address: 'alias1.user@example.com',
      });
    } catch (e) {
      expect(e.name).toEqual(AliasDoesNotExistError.NAME);
    }
  });

  it('should refuse changing an alias to an alias that already exists', async () => {
    expect(setupError).toBeFalsy();
    try {
      await service.updateAlias('user', 'alias1.user@example.com', {
        address: 'alias1.user@example.com',
      });
    } catch (e) {
      expect(e.name).toEqual(AliasAlreadyExistsError.NAME);
    }
  });

  it('should refuse deleting an alias that does not exist', async () => {
    expect(setupError).toBeFalsy();
    try {
      await service.deleteAlias('user', 'notexists@example.com');
    } catch (e) {
      expect(e.name).toEqual(AliasDoesNotExistError.NAME);
    }
  });
});
