import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AliasModule } from './alias/alias.module';
import * as Joi from '@hapi/joi';
import { AliasController } from './alias/alias.controller';
import { LoggerService } from './logger/logger.service';

/**
 * The basic Nest app module
 */
@Module({
  imports: [
    // Configuration and validation of the configuration module
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        AM_PORT: Joi.number()
          .default(3000)
          .greater(0)
          .less(65536),
        AM_LOGLEVEL: Joi.string()
          .default('info')
          .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'),
        AM_CRYPTO_JWT_SECRET: Joi.string()
          .required()
          .min(64),
        AM_CRYPTO_JWT_EXPIRES: Joi.string().default('30m'),
        AM_LDAP_URL: Joi.string().required(),
        AM_LDAP_BIND_DN: Joi.string().required(),
        AM_LDAP_BIND_PW: Joi.string().required(),
        AM_LDAP_USER_DN: Joi.string().required(),
        AM_LDAP_USER_ATTR: Joi.string().default('uid'),
        AM_LDAP_ALIAS_ATTR: Joi.string().default('registeredAddress'),
        AM_TOKEN_COOKIE: Joi.string().default('AM-Token'),
        AM_TOKEN_MAXAGE: Joi.number().default(1800000),
        AM_DEFAULT_PAGESIZE: Joi.number().default(5),
      }),
    }),
    AuthModule,
    AliasModule,
  ],
  controllers: [AliasController],
  providers: [LoggerService],
})
export class AppModule {}
