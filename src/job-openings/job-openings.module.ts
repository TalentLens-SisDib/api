import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { JobOpeningCreationService } from './services/job-opening-creation.service.js';
import { JobOpeningDeleteService } from './services/job-opening-delete.service.js';
import { JobOpeningEditService } from './services/job-opening-edit.service.js';
import { JobOpeningFindService } from './services/job-opening-find.service.js';
import { JobApplicationService } from './services/job-application.service.js';
import { JobOpeningsController } from './job-openings.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [JobOpeningsController],
  providers: [
    JwtAuthGuard,
    JobOpeningFindService,
    JobOpeningCreationService,
    JobOpeningEditService,
    JobOpeningDeleteService,
    JobApplicationService,
  ],
  exports: [JobOpeningFindService],
})
export class JobOpeningsModule {}
