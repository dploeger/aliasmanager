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
import { Alias } from '../schemas/alias';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AliasAlreadyExistsError } from '../errors/alias-already-exists.error';
import { AliasDoesNotExistError } from '../errors/alias-does-not-exist.error';
import { AliasService } from './alias.service';
import { Request } from 'express';
import { AccountInvalidError } from '../errors/account-invalid.error';
import { Error } from '../schemas/error';
import { Results } from '../schemas/results';

/**
 * A controller handling alias requests
 */
@Controller('api/account/alias')
export class AliasController {
  constructor(private accountService: AliasService) {}

  @Get()
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiBadRequestResponse({
    description: 'An invalid account was specified',
    type: Error,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error',
    type: Error,
  })
  @ApiOkResponse({
    description: 'The list of matching aliases',
    type: [Alias],
  })
  @ApiQuery({
    name: 'filter',
    description: 'A filter value to match aliases to',
    required: false,
  })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fetch all aliases or a filtered list' })
  async getAliases(
    @Param() params,
    @Req() request: Request,
  ): Promise<Results<Alias>> {
    try {
      return await this.accountService.getAliases(
        (request.user as any).username,
        request.query.filter as string,
      );
    } catch (e) {
      /* istanbul ignore next */
      switch (e.name) {
        case AccountInvalidError.NAME:
          /* istanbul ignore next */
          throw new BadRequestException(e.message);
        default:
          /* istanbul ignore next */
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Post()
  @ApiBearerAuth()
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: Alias, description: 'The alias to be created' })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error',
    type: Error,
  })
  @ApiCreatedResponse({
    description: 'The token was created successfully',
    type: Alias,
  })
  @ApiBadRequestResponse({
    description: 'An invalid account was specified',
    type: Error,
  })
  @ApiConflictResponse({
    description: 'The given alias already exists',
    type: Error,
  })
  @ApiOperation({ summary: 'Create a new alias' })
  async createAlias(
    @Body() alias: Alias,
    @Req() request: Request,
  ): Promise<Alias> {
    try {
      return await this.accountService.createAlias(
        (request.user as any).username,
        alias,
      );
    } catch (e) {
      switch (e.name) {
        case AccountInvalidError.NAME:
          throw new BadRequestException(e.message);
        case AliasAlreadyExistsError.NAME:
          throw new ConflictException(e.message);
        default:
          /* istanbul ignore next */
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Put(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiBody({ type: Alias, description: 'The new alias' })
  @ApiParam({
    name: 'address',
    description: 'The alias to change',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error',
    type: Error,
  })
  @ApiCreatedResponse({
    description: 'The token was created successfully',
    type: Alias,
  })
  @ApiBadRequestResponse({
    description: 'An invalid account was specified',
    type: Error,
  })
  @ApiNotFoundResponse({
    description: 'The given alias to change was not found',
    type: Error,
  })
  @ApiConflictResponse({
    description: 'The given alias already exists',
    type: Error,
  })
  @ApiOperation({ summary: 'Update an alias' })
  async updateAlias(
    @Body() alias: Alias,
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
          /* istanbul ignore next */
          throw new BadRequestException(e.message);
        case AliasAlreadyExistsError.NAME:
          throw new ConflictException(e.message);
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
        default:
          /* istanbul ignore next */
          throw new InternalServerErrorException(e.message);
      }
    }
  }

  @Delete(':address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @HttpCode(204)
  @ApiParam({
    name: 'address',
    description: 'The alias to delete',
  })
  @ApiNoContentResponse({
    description: 'The alias was deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'An invalid account was specified',
    type: Error,
  })
  @ApiNotFoundResponse({
    description: 'The given alias to change was not found',
    type: Error,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error',
    type: Error,
  })
  @ApiOperation({ summary: 'Delete an alias' })
  async deleteAlias(@Param() params, @Req() request: Request): Promise<void> {
    try {
      await this.accountService.deleteAlias(
        (request.user as any).username,
        params.address,
      );
    } catch (e) {
      switch (e.name) {
        case AccountInvalidError.NAME:
          /* istanbul ignore next */
          throw new BadRequestException(e.message);
        case AliasDoesNotExistError.NAME:
          throw new NotFoundException(e.message);
        default:
          /* istanbul ignore next */
          throw new InternalServerErrorException(e.message);
      }
    }
  }
}
