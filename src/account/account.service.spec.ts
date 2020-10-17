import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { ConfigModule } from '@nestjs/config';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import * as winston from 'winston';
import * as logform from 'logform';
import { setupLogger } from '../../test/setup-logger';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    setupLogger();
    const stats = await startContainer();
    winston.info('Creating Testmodule');
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => {
              return {
                AM_LDAP_URL: `ldap://localhost:${stats.NetworkSettings.Ports['389/tcp'][0].HostPort}/`,
                AM_LDAP_BIND_DN: 'cn=admin,dc=example,dc=com',
                AM_LDAP_BIND_PW: 'admin',
                AM_LDAP_USER_DN: 'dc=example,dc=com',
                AM_LDAP_USER_ATTR: 'uid',
                AM_LDAP_ALIAS_ATTR: 'registeredAddress',
              };
            },
          ],
        }),
      ],
      providers: [AccountService],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(async () => {
    await stopContainer();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all aliases', async () => {
    const aliases = await service.getAliases('user');
    expect(aliases).toHaveLength(1);
    expect(aliases[0]).toStrictEqual({
      address: 'alias1.user@example.com',
    });
  });
});
