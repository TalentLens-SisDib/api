import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { SkillsModule } from './skills.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfileCreationService } from './services/profile-creation.service.js';
import { ProfileDeleteService } from './services/profile-delete.service.js';
import { ProfileEditService } from './services/profile-edit.service.js';
import { ProfileFindService } from './services/profile-find.service.js';
import { ProfileInterviewService } from './services/profile-interview.service.js';
import { CulturalFitService } from './services/cultural-fit.service.js';
import { ProfilesController } from './profiles.controller.js';

@Module({
  imports: [AuthModule, SkillsModule],
  controllers: [ProfilesController],
  providers: [
    AiService,
    JwtAuthGuard,
    ProfileFindService,
    ProfileCreationService,
    ProfileEditService,
    ProfileDeleteService,
    ProfileInterviewService,
    CulturalFitService,
  ],
  exports: [ProfileFindService, ProfileInterviewService],
})
export class ProfilesModule {}
