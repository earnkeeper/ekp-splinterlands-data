import { EkConfigService, SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ApiModule } from './shared/api';
import { DbModule } from './shared/db/db.module';
import { GameModule } from './shared/game/game.module';

export const MODULE_DEF = {
  imports: [
    MongooseModule.forRootAsync({ useClass: EkConfigService }),
    ScheduleModule.forRoot(),
    ApiModule,
    DbModule,
    GameModule,
    SdkModule,
    SchedulerModule,
  ],
  providers: [],
};

@Module(MODULE_DEF)
export class MainModule {}
