import { Module } from '@nestjs/common';
import { UserCreationService } from './services/user-creation.service.js';
import { UserDeleteService } from './services/user-delete.service.js';
import { UserEditService } from './services/user-edit.service.js';
import { UserFindService } from './services/user-find.service.js';
import { UsersController } from './users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    UserFindService,
    UserCreationService,
    UserEditService,
    UserDeleteService,
  ],
  exports: [UserFindService],
})
export class UsersModule {}
