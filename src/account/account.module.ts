import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AccountService, ConfigService],
  exports: [AccountService],
})
export class AccountModule {}
