import { ApiModule } from '@/shared/api';
import { DbModule } from '@/shared/db';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { GameModule } from '../shared/game/game.module';
import { BattleProcessor } from './processors/battle.processor';
import { PlannerProcessor } from './processors/planner.processor';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ApiModule,
    DbModule,
    GameModule,
    BullModule.registerQueue({ name: 'planner' }),
  ],
  providers: [SchedulerService, BattleProcessor, PlannerProcessor],
})
export class SchedulerModule {}
