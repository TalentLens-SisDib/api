import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SkillCreationService } from './services/skill-creation.service.js';
import { SkillDeleteService } from './services/skill-delete.service.js';
import { SkillEditService } from './services/skill-edit.service.js';
import { SkillFindService } from './services/skill-find.service.js';
import { SkillsController } from './skills.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [SkillsController],
  providers: [
    JwtAuthGuard,
    SkillFindService,
    SkillCreationService,
    SkillEditService,
    SkillDeleteService,
  ],
  exports: [SkillFindService],
})
export class SkillsModule {}