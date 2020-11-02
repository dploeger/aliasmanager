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
import { AccountModule } from '../account/account.module';

describe('The Alias Controller', () => {
  let controller: AliasController;
  let token: string;
  let app: INestApplication;
  let agent: SuperTest<SuperTestTest>;

  beforeEach(async () => {
    setupLogger();
    const stats = await startContainer();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AliasController],
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
                AM_CRYPTO_JWT_SECRET: 'secret',
                AM_CRYPTO_JWT_EXPIRES: '60s',
                AM_TOKEN_COOKIE: 'token',
                AM_TOKEN_MAXAGE: '60000',
              };
            },
          ],
        }),
        AuthModule,
        AccountModule,
      ],
    }).compile();

    controller = module.get<AliasController>(AliasController);
    const jwtService = module.get<JwtService>(JwtService);

    token = jwtService.sign({
      username: 'user',
    });

    app = module.createNestApplication();
    agent = request.agent(app.getHttpServer());
    agent.jar.setCookie(`token=${token}; MaxAge=60;`);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await stopContainer();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('authenticated with Bearer token', () => {
    it('should get all alias', () => {
      return request(app.getHttpServer())
        .get('/api/account/alias')
        .auth(token, {
          type: 'bearer',
        })
        .expect(200)
        .expect([{ address: 'alias1.user@example.com' }]);
    });

    it('should filter for aliases', () => {
      return request(app.getHttpServer())
        .get('/api/account/alias')
        .query('filter=alias1')
        .auth(token, {
          type: 'bearer',
        })
        .expect(200)
        .expect([{ address: 'alias1.user@example.com' }]);
    });

    it('should receive no results for an invalid filter', () => {
      return request(app.getHttpServer())
        .get('/api/account/alias')
        .query('filter=noting')
        .auth(token, {
          type: 'bearer',
        })
        .expect(200)
        .expect([]);
    });

    it('should add a new alias', () => {
      return request(app.getHttpServer())
        .post('/api/account/alias')
        .auth(token, {
          type: 'bearer',
        })
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(201)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should reject adding an existing alias', () => {
      return request(app.getHttpServer())
        .post('/api/account/alias')
        .auth(token, {
          type: 'bearer',
        })
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
      return request(app.getHttpServer())
        .put('/api/account/alias/alias1.user@example.com')
        .auth(token, {
          type: 'bearer',
        })
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(200)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should refuse updating an alias that does not exist', () => {
      return request(app.getHttpServer())
        .put('/api/account/alias/nothing@example.com')
        .auth(token, {
          type: 'bearer',
        })
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(404);
    });

    it('should refuse updating an alias to an alias that already exists', () => {
      return request(app.getHttpServer())
        .put('/api/account/alias/alias1.user@example.com')
        .auth(token, {
          type: 'bearer',
        })
        .send({
          address: 'alias1.user@example.com',
        })
        .expect(409);
    });

    it('should delete an alias', () => {
      return request(app.getHttpServer())
        .delete('/api/account/alias/alias1.user@example.com')
        .auth(token, {
          type: 'bearer',
        })
        .expect(204);
    });

    it('should refuse deleting an alias that does not exist', () => {
      return request(app.getHttpServer())
        .delete('/api/account/alias/nothing@example.com')
        .auth(token, {
          type: 'bearer',
        })
        .expect(404);
    });
  });

  // Tests with cookie auth

  describe('authenticated with a cookie', () => {
    it('should get all alias (with cookie)', () => {
      return agent
        .get('/api/account/alias')
        .expect(200)
        .expect([{ address: 'alias1.user@example.com' }]);
    });

    it('should filter for aliases (with cookie)', () => {
      return agent
        .get('/api/account/alias')
        .query('filter=alias1')
        .expect(200)
        .expect([{ address: 'alias1.user@example.com' }]);
    });

    it('should receive no results for an invalid filter (with cookie)', () => {
      return agent
        .get('/api/account/alias')
        .query('filter=noting')
        .expect(200)
        .expect([]);
    });

    it('should add a new alias (with cookie)', () => {
      return agent
        .post('/api/account/alias')
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(201)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should reject adding an existing alias (with cookie)', () => {
      return agent
        .post('/api/account/alias')
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

    it('should update an alias (with cookie)', () => {
      return agent
        .put('/api/account/alias/alias1.user@example.com')
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(200)
        .expect({
          address: 'alias2.user@example.com',
        });
    });

    it('should refuse updating an alias that does not exist (with cookie)', () => {
      return agent
        .put('/api/account/alias/nothing@example.com')
        .send({
          address: 'alias2.user@example.com',
        })
        .expect(404);
    });

    it('should refuse updating an alias to an alias that already exists (with cookie)', () => {
      return agent
        .put('/api/account/alias/alias1.user@example.com')
        .send({
          address: 'alias1.user@example.com',
        })
        .expect(409);
    });

    it('should delete an alias (with cookie)', () => {
      return agent
        .delete('/api/account/alias/alias1.user@example.com')
        .expect(204);
    });

    it('should refuse deleting an alias that does not exist (with cookie)', () => {
      return agent.delete('/api/account/alias/nothing@example.com').expect(404);
    });
  });
});
