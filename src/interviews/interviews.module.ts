import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { InterviewCreationService } from './services/interview-creation.service.js';
import { InterviewDeleteService } from './services/interview-delete.service.js';
import { InterviewEditService } from './services/interview-edit.service.js';
import { InterviewFindService } from './services/interview-find.service.js';
import { InterviewsController } from './interviews.controller.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [InterviewsController],
  providers: [
    JwtAuthGuard,
    InterviewFindService,
    InterviewCreationService,
    InterviewEditService,
    InterviewDeleteService,
  ],
  exports: [InterviewFindService],
})
export class InterviewsModule {}