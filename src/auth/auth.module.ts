import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccountModule } from '../account/account.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { LdapStrategy } from './ldap.strategy';
import { Configuration } from '../configuration';

@Module({
  imports: [
    AccountModule,
    PassportModule,
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
})
export class AuthModule {}
