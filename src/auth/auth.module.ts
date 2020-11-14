import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AliasModule } from '../alias/alias.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { LdapStrategy } from './ldap.strategy';
import { Configuration } from '../configuration';
import { AuthController } from './auth.controller';

/**
 * A Nest authentication module
 */
@Module({
  imports: [
    AliasModule,
    PassportModule,
    // configuring the JWT support
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Configuration>) => {
        return {
          secret: configService.get('AM_CRYPTO_JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get('AM_CRYPTO_JWT_EXPIRES'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LdapStrategy, JwtStrategy, ConfigService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
