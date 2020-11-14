import { Module } from '@nestjs/common';
import { AliasService } from './alias.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * A nest module for alias management
 */
@Module({
  imports: [ConfigModule],
  providers: [AliasService, ConfigService],
  exports: [AliasService],
})
export class AliasModule {}
