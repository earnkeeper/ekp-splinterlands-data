import { EkConfigService, SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BattleProcessor } from './schedule/battle.processor';
import { CardProcessor } from './schedule/card.processor';
import { ScheduleService } from './schedule/schedule';
import { StatsProcessor } from './schedule/stats.processor';
import { ApiModule } from './shared/api';
import { DbModule } from './shared/db/db.module';
import { GameModule } from './shared/game/game.module';

export const MODULE_DEF = {
  imports: [
    MongooseModule.forRootAsync({ useClass: EkConfigService }),
    SdkModule,
    ScheduleModule.forRoot(),
    ApiModule,
    DbModule,
    GameModule,
  ],
  providers: [ScheduleService, BattleProcessor, CardProcessor, StatsProcessor],
};

@Module(MODULE_DEF)
export class ScheduleApp {}
