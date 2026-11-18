import { Module } from '@nestjs/common';
import { TalentPoolController } from './talent-pool.controller.js';
import { TalentPoolService } from './talent-pool.service.js';

@Module({
  controllers: [TalentPoolController],
  providers: [TalentPoolService],
})
export class TalentPoolModule {}
