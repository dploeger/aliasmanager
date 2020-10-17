import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AliasDto } from '../dto/alias.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AliasAlreadyExistsError } from '../errors/alias-already-exists.error';
import { AliasDoesNotExistError } from '../errors/alias-does-not-exist.error';
import { AccountService } from '../account/account.service';

@Controller('api/account/:username')
export class AliasController {
  constructor(private accountService: AccountService) {}

  @Get('alias')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAliases(@Param() params, @Req() request): Promise<AliasDto[]> {
    return await this.accountService.getAliases(
      params.username,
      request.query.filter,
    );
  }

  @Post('alias')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: AliasDto })
  async createAlias(
    @Body() alias: AliasDto,
    @Param() params,
  ): Promise<AliasDto[]> {
    try {
      return await this.accountService.createAlias(params.username, alias);
    } catch (e) {
      switch (e.name) {
        case AliasAlreadyExistsError.NAME:
          throw new BadRequestException(e.message);
      }
    }
  }

  @Put('alias/:address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: AliasDto })
  @HttpCode(204)
  async updateAlias(@Body() alias: AliasDto, @Param() params) {
    try {
      await this.accountService.updateAlias(
        params.username,
        params.address,
        alias,
      );
    } catch (e) {
      switch (e.name) {
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
      }
    }
  }

  @Delete('alias/:address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteAlias(@Param() params): Promise<void> {
    try {
      await this.accountService.deleteAlias(params.username, params.address);
    } catch (e) {
      switch (e.name) {
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
      }
    }
  }
}
