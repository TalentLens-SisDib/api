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
import type { Response } from 'express';
import { User } from '../generated/prisma/client.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserCreationService } from './services/user-creation.service.js';
import { UserDeleteService } from './services/user-delete.service.js';
import { UserEditService } from './services/user-edit.service.js';
import { UserFindService } from './services/user-find.service.js';

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
  findAll(): Promise<User[]> {
    return this.userFindService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userFindService.findById(id);
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const user = await this.userCreationService.create(dto);
    res.setHeader('Location', `/users/${user.id}`);

    return user;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.userEditService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userDeleteService.remove(id);
  }
}
