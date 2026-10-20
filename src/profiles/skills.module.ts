import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SkillsService } from './services/skills.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}