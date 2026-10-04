import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { LoginController } from './login.controller.js';
import { LoginService } from './login.service.js';
import { getJwtSecret } from './jwt.config.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => ({ secret: getJwtSecret() }),
    }),
  ],
  controllers: [LoginController],
  providers: [LoginService],
})
export class LoginModule {}
