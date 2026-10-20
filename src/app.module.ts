import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { LoginModule } from './login/login.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { JobOpeningsModule } from './job-openings/job-openings.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, LoginModule, SkillsModule, JobOpeningsModule, ProfilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
