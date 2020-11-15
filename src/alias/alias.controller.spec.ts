import { Test, TestingModule } from '@nestjs/testing';
import { AliasController } from './alias.controller';
import { setupLogger } from '../../test/setup-logger';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import * as request from 'supertest';
import { SuperTest, Test as SuperTestTest } from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AliasModule } from './alias.module';
import * as winston from 'winston';

describe('The Alias Controller', () => {
  let controller: AliasController;
  let token: string;
  let app: INestApplication;
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AliasController],
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
                AM_CRYPTO_JWT_SECRET: 'secret',
                AM_CRYPTO_JWT_EXPIRES: '60s',
                AM_TOKEN_COOKIE: 'token',
                AM_TOKEN_MAXAGE: '60000',
                AM_DEFAULT_PAGESIZE: '10',
              };
            },
          ],
        }),
        AuthModule,
        AliasModule,
      ],
    }).compile();

    controller = module.get<AliasController>(AliasController);
    const jwtService = module.get<JwtService>(JwtService);
    (token = jwtService.sign({
      username: 'user',
    })),
      (app = module.createNestApplication());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await stopContainer();
  });

  it('should be defined', () => {
    expect(setupError).toBeFalsy();
    expect(controller).toBeDefined();
  });

  /*
    A test abstraction to be able to support cookie auth as well
    as bearer auth
   */

  function aliasTests(
    tester: () => SuperTest<SuperTestTest>,
    authenticatorFuncion = null,
  ) {
    if (!authenticatorFuncion) {
      authenticatorFuncion = test => test;
    }
    it('should get all aliases', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(tester().get('/api/account/alias'))
        .expect(200)
        .expect({
          pageSize: 10,
          page: 1,
          total: 1,
          results: [{ address: 'alias1.user@example.com' }],
        });
    });

    it('should filter for aliases', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester()
          .get('/api/account/alias')
          .query('filter=alias1'),
      )
        .expect(200)
        .expect({
          pageSize: 10,
          page: 1,
          total: 1,
          results: [{ address: 'alias1.user@example.com' }],
        });
    });

    it('should receive no results for an invalid filter', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester()
          .get('/api/account/alias')
          .query('filter=noting'),
      )
        .expect(200)
        .expect({
          pageSize: 10,
          page: 1,
          total: 0,
          results: [],
        });
    });

    it('should receive results of other pages', async () => {
      expect(setupError).toBeFalsy();
      await authenticatorFuncion(tester().post('/api/account/alias')).send({
        address: 'alias2.user@example.com',
      });
      await authenticatorFuncion(
        tester()
          .get('/api/account/alias')
          .query('pageSize=1&page=1'),
      )
        .expect(200)
        .expect({
          pageSize: 1,
          page: 1,
          total: 2,
          results: [{ address: 'alias1.user@example.com' }],
        });
      return authenticatorFuncion(
        tester()
          .get('/api/account/alias')
          .query('pageSize=1&page=2'),
      )
        .expect(200)
        .expect({
          pageSize: 1,
          page: 2,
          total: 2,
          results: [{ address: 'alias2.user@example.com' }],
        });
    });

    it('should add a new alias', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(tester().post('/api/account/alias'))
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(201)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should reject adding an existing alias', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(tester().post('/api/account/alias'))
        .send({
          address: 'alias1.user@example.com',
        })
        .expect(409)
        .expect({
          statusCode: 409,
          message:
            'User user already has an alias for address alias1.user@example.com',
          error: 'Conflict',
        });
    });

    it('should update an alias', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester().put('/api/account/alias/alias1.user@example.com'),
      )
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(200)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should refuse updating an alias that does not exist', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester().put('/api/account/alias/nothing@example.com'),
      )
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(404);
    });

    it('should refuse updating an alias to an alias that already exists', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester().put('/api/account/alias/alias1.user@example.com'),
      )
        .send({
          address: 'alias1.user@example.com',
        })
        .expect(409);
    });

    it('should delete an alias', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester().delete('/api/account/alias/alias1.user@example.com'),
      ).expect(204);
    });

    it('should refuse deleting an alias that does not exist', () => {
      expect(setupError).toBeFalsy();
      return authenticatorFuncion(
        tester().delete('/api/account/alias/nothing@example.com'),
      ).expect(404);
    });
  }

  describe('authenticated with Bearer token', () => {
    aliasTests(
      () => request(app.getHttpServer()),
      (test: SuperTestTest) => {
        return test.auth(token, { type: 'bearer' });
      },
    );
  });

  describe('authenticated with a cookie', () => {
    aliasTests(() => {
      const agent = request.agent(app.getHttpServer());
      agent.jar.setCookie(`token=${token}; MaxAge=60;`);
      return agent;
    });
  });
});
