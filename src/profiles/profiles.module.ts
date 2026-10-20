import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfileCreationService } from './services/profile-creation.service.js';
import { ProfileDeleteService } from './services/profile-delete.service.js';
import { ProfileEditService } from './services/profile-edit.service.js';
import { ProfileFindService } from './services/profile-find.service.js';
import { ProfilesController } from './profiles.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
  providers: [
    JwtAuthGuard,
    ProfileFindService,
    ProfileCreationService,
    ProfileEditService,
    ProfileDeleteService,
  ],
  exports: [ProfileFindService],
})
export class ProfilesModule {}