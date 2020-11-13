import { Test, TestingModule } from '@nestjs/testing';
import { setupLogger } from '../../test/setup-logger';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import * as winston from 'winston';

describe('Auth Controller', () => {
  let controller: AuthController;
  let app: INestApplication;
  let module: TestingModule;
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
    module = await Test.createTestingModule({
      controllers: [AuthController],
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
              };
            },
          ],
        }),
        AuthModule,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    app = module.createNestApplication();
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

  it('should return a JWT token and a httponly cookie', () => {
    expect(setupError).toBeFalsy();
    return request(app.getHttpServer())
      .get('/api/auth/login')
      .auth('user', 'password')
      .expect(200)
      .expect('set-cookie', /token=.+; Max-Age=60;.+; HttpOnly/)
      .expect(res => {
        if (!('token' in res.body)) {
          throw new Error('Token property not found');
        }
        if (res.body.token == '') {
          throw new Error('Token empty');
        }
        const jwtService = module.get<JwtService>(JwtService);
        const payload = jwtService.decode(res.body.token) as {
          [key: string]: any;
        };
        if (payload.username !== 'user') {
          throw new Error('Invalid JWT payload');
        }
      });
  });

  it('should throw on wrong credentials', () => {
    expect(setupError).toBeFalsy();
    return request(app.getHttpServer())
      .get('/api/auth/login')
      .auth('user', 'wrong')
      .expect(401);
  });

  it('should remove the cookie when logging out', async () => {
    expect(setupError).toBeFalsy();
    const agent = await request.agent(app.getHttpServer());

    await agent
      .get('/api/auth/login')
      .auth('user', 'password')
      .expect(200)
      .expect('set-cookie', /token=.+; Max-Age=60;.+; HttpOnly/);

    return agent
      .get('/api/auth/logout')
      .expect(204)
      .expect('set-cookie', /token=;.+; Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  });
});
