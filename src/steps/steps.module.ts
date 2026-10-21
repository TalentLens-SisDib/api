import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StepCreationService } from './services/step-creation.service.js';
import { StepDeleteService } from './services/step-delete.service.js';
import { StepEditService } from './services/step-edit.service.js';
import { StepFindService } from './services/step-find.service.js';
import { StepsController } from './steps.controller.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [StepsController],
  providers: [
    JwtAuthGuard,
    StepFindService,
    StepCreationService,
    StepEditService,
    StepDeleteService,
  ],
  exports: [StepFindService],
})
export class StepsModule {}