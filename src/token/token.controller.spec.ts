import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';
import { setupLogger } from '../../test/setup-logger';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

describe('Token Controller', () => {
  let controller: TokenController;
  let app: INestApplication;
  let module: TestingModule;

  beforeEach(async () => {
    setupLogger();
    const stats = await startContainer();
    module = await Test.createTestingModule({
      controllers: [TokenController],
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
                AM_CRYPTO_JWT_EXPIRES: '60',
              };
            },
          ],
        }),
        AuthModule,
      ],
    }).compile();

    controller = module.get<TokenController>(TokenController);
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

  it('should return a JWT token', () => {
    return request(app.getHttpServer())
      .get('/api/token')
      .auth('user', 'password')
      .expect(200)
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
    return request(app.getHttpServer())
      .get('/api/token')
      .auth('user', 'wrong')
      .expect(401);
  });
});
