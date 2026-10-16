import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthPayload } from '../auth/auth-payload.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserCreationService } from './services/user-creation.service.js';
import { UserDeleteService } from './services/user-delete.service.js';
import { UserEditService } from './services/user-edit.service.js';
import { UserFindService } from './services/user-find.service.js';
import { assertCanManageUser } from './user-access.js';

@ApiTags('users')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly userFindService: UserFindService,
    private readonly userCreationService: UserCreationService,
    private readonly userEditService: UserEditService,
    private readonly userDeleteService: UserDeleteService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List the users of the caller company' })
  @ApiOkResponse({
    description: 'Users belonging to the company of the caller',
    type: [UserResponseDto],
  })
  findAll(@CurrentUser() requester: AuthPayload): Promise<UserResponseDto[]> {
    return this.userFindService.findAllByCompany(requester.companyId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single user by id',
    description:
      'Allowed for the caller own account, or for any user of the same company when the caller is an admin',
  })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiOkResponse({ description: 'The requested user', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid integer' })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  @ApiForbiddenResponse({
    description: 'The caller may not read that user',
  })
  async findOne(
    @CurrentUser() requester: AuthPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.userFindService.findById(id);
    assertCanManageUser(requester, user);

    return user;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user',
    description: 'The user is always created in the company of the caller',
  })
  @ApiCreatedResponse({
    description: 'The created user, without the password',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiConflictResponse({ description: 'The email is already taken' })
  async create(
    @CurrentUser() requester: AuthPayload,
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.userCreationService.create(requester, dto);
    res.setHeader('Location', `/users/${user.id}`);

    return user;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the provided fields of a user',
    description:
      'Allowed for the caller own account, or for any user of the same company when the caller is an admin',
  })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiOkResponse({
    description: 'The updated user, without the password',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not edit that user' })
  @ApiConflictResponse({ description: 'The email is already taken' })
  update(
    @CurrentUser() requester: AuthPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userEditService.update(requester, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Allowed for the caller own account, or for any user of the same company when the caller is an admin',
  })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiNoContentResponse({ description: 'The user was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid integer' })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  @ApiForbiddenResponse({ description: 'The caller may not delete that user' })
  remove(
    @CurrentUser() requester: AuthPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.userDeleteService.remove(requester, id);
  }
}
