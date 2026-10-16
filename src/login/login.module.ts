import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { LoginController } from './login.controller.js';
import { LoginService } from './login.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
