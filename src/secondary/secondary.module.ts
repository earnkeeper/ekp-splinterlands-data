import { config } from '@/config';
import { ApiModule } from '@/shared/api';
import { GameModule } from '@/shared/game';
import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbModule } from '../shared/db/db.module';
import { BattleProcessor } from './processors/battle.processor';
import { PlannerProcessor } from './processors/planner.processor';
import { TeamsProcessor } from './processors/teams.processor';

export const MODULE_DEF = {
  imports: [
    MongooseModule.forRoot(config('MONGO_URI'), { autoIndex: true }),
    BullModule.registerQueue(
      { name: 'teams' },
      { name: 'battles' },
      { name: 'planner' },
    ),
    ApiModule,
    DbModule,
    GameModule,
    SdkModule,
  ],
  providers: [PlannerProcessor, TeamsProcessor, BattleProcessor],
};

@Module(MODULE_DEF)
export class SecondaryModule {}
