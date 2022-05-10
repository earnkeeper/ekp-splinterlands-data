import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';

export const MODULE_DEF = {
  imports: [
    SdkModule,
    BullModule.registerQueue(
      { name: 'teams' },
      { name: 'battles' },
      { name: 'planner' },
      { name: 'market' },
    ),
    ScheduleModule.forRoot(),
  ],
  providers: [],
};

@Module(MODULE_DEF)
export class PrimaryModule {
  constructor(
    private redisService: RedisService,
    @InjectQueue('battles') private battleQueue: Queue,
    @InjectQueue('planner') private plannerQueue: Queue,
    @InjectQueue('market') private marketQueue: Queue,
  ) {}

  async onModuleInit() {
    const client = this.redisService.getClient('DEFAULT_CLIENT');
    await client.flushall();

    this.battleQueue.add(
      {},
      {
        delay: 0,
        repeat: { every: 10 * 60 * 1000 },
        removeOnComplete: true,
      },
    );
    this.plannerQueue.add(
      {},
      {
        delay: 0,
        repeat: { every: 10 * 60 * 1000 },
        removeOnComplete: true,
      },
    );
    this.marketQueue.add(
      {},
      {
        delay: 0,
        repeat: { every: 10 * 60 * 1000 },
        removeOnComplete: true,
      },
    );
  }
}
