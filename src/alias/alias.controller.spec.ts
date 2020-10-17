import { Test, TestingModule } from '@nestjs/testing';
import { AliasController } from './alias.controller';
import { setupLogger } from '../../test/setup-logger';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import { AccountService } from '../account/account.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AccountModule } from '../account/account.module';

describe('Alias Controller', () => {
  let controller: AliasController;
  let token: string;
  let app: INestApplication;

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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await stopContainer();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

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
      .expect(400)
      .expect({
        statusCode: 400,
        message:
          'User user already has an alias for address alias1.user@example.com',
        error: 'Bad Request',
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
      .expect(201)
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
