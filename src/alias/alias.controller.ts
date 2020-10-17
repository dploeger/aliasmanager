import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
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
import { IncomingMessage } from 'http';
import { Request } from 'express';
import { AccountInvalidError } from '../errors/account-invalid.error';

@Controller('api/account/alias')
export class AliasController {
  constructor(private accountService: AccountService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAliases(
    @Param() params,
    @Req() request: Request,
  ): Promise<AliasDto[]> {
    try {
      return await this.accountService.getAliases(
        (request.user as any).username,
        request.query.filter as string,
      );
    } catch (e) {
      switch (e.name) {
        case AccountInvalidError.NAME:
          throw new BadRequestException(e.message);
        default:
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: AliasDto })
  async createAlias(
    @Body() alias: AliasDto,
    @Req() request: Request,
  ): Promise<AliasDto> {
    try {
      return await this.accountService.createAlias(
        (request.user as any).username,
        alias,
      );
    } catch (e) {
      switch (e.name) {
        case (AccountInvalidError.NAME, AliasAlreadyExistsError.NAME):
          throw new BadRequestException(e.message);
        default:
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Put(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: AliasDto })
  @HttpCode(201)
  async updateAlias(
    @Body() alias: AliasDto,
    @Req() request: Request,
    @Param() params,
  ) {
    try {
      return await this.accountService.updateAlias(
        (request.user as any).username,
        params.address,
        alias,
      );
    } catch (e) {
      switch (e.name) {
        case AccountInvalidError.NAME:
          throw new BadRequestException(e.message);
        case AliasAlreadyExistsError.NAME:
          throw new ConflictException(e.message);
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
        default:
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Delete(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteAlias(@Param() params, @Req() request: Request): Promise<void> {
    try {
      await this.accountService.deleteAlias(
        (request.user as any).username,
        params.address,
      );
    } catch (e) {
      switch (e.name) {
        case AccountInvalidError.NAME:
          throw new BadRequestException(e.message);
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
        default:
          throw new InternalServerErrorException(e.message);
      }
    }
  }
}
