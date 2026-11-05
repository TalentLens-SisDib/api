import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CulturalFitCreationService } from './services/cultural-fit-creation.service.js';
import { CulturalFitFindService } from './services/cultural-fit-find.service.js';
import { CulturalFitsController } from './cultural-fits.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [CulturalFitsController],
  providers: [
    JwtAuthGuard,
    CulturalFitFindService,
    CulturalFitCreationService,
  ],
})
export class CulturalFitsModule {}
