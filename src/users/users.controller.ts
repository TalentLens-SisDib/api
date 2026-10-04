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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserCreationService } from './services/user-creation.service.js';
import { UserDeleteService } from './services/user-delete.service.js';
import { UserEditService } from './services/user-edit.service.js';
import { UserFindService } from './services/user-find.service.js';

@ApiTags('users')
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
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({
    description: 'All users, ordered by id',
    type: [UserResponseDto],
  })
  findAll(): Promise<UserResponseDto[]> {
    return this.userFindService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single user by id' })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiOkResponse({ description: 'The requested user', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'The id is not a valid integer' })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.userFindService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'The created user, without the password',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The payload failed validation or references an unknown companyId',
  })
  @ApiConflictResponse({ description: 'The email is already taken' })
  async create(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.userCreationService.create(dto);
    res.setHeader('Location', `/users/${user.id}`);

    return user;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the provided fields of a user' })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiOkResponse({
    description: 'The updated user, without the password',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The payload failed validation or references an unknown companyId',
  })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  @ApiConflictResponse({ description: 'The email is already taken' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userEditService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User identifier', example: 1 })
  @ApiNoContentResponse({ description: 'The user was deleted' })
  @ApiBadRequestResponse({ description: 'The id is not a valid integer' })
  @ApiNotFoundResponse({ description: 'No user exists with that id' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userDeleteService.remove(id);
  }
}
