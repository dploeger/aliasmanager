import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokenController } from './token/token.controller';
import { AccountModule } from './account/account.module';
import * as Joi from '@hapi/joi';
import { getHashes } from 'crypto';
import { AliasController } from './alias/alias.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client', 'dist'),
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AM_CRYPTO_SALT: Joi.string()
          .required()
          .min(64),
        AM_CRYPTO_ITERATIONS: Joi.number()
          .default(10000)
          .min(10000),
        AM_CRYPTO_SIZE: Joi.number()
          .default(80)
          .min(80),
        AM_CRYPTO_DIGEST: Joi.string()
          .valid(...getHashes())
          .default('sha256'),
        AM_CRYPTO_JWT_SECRET: Joi.string()
          .required()
          .min(64),
        AM_CRYPTO_JWT_EXPIRES: Joi.string().default('60s'),
        AM_LDAP_URL: Joi.string().required(),
        AM_LDAP_BIND_DN: Joi.string().required(),
        AM_LDAP_BIND_PW: Joi.string().required(),
        AM_LDAP_USER_DN: Joi.string().required(),
        AM_LDAP_USER_ATTR: Joi.string()
          .default('uid')
          .required(),
        AM_LDAP_ALIAS_ATTR: Joi.string()
          .default('registeredAddress')
          .required(),
      }),
    }),
    AuthModule,
    AccountModule,
  ],
  controllers: [TokenController, AliasController],
  providers: [AppService],
})
export class AppModule {}
