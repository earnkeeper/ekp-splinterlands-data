import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cluster from 'cluster';
import { RedisService } from 'nestjs-redis';
import { BattleProcessor } from './processors/battle.processor';
import { PlannerProcessor } from './processors/planner.processor';

@Injectable()
export class SchedulerService {
  constructor(
    private battleProcessor: BattleProcessor,
    private plannerProcessor: PlannerProcessor,
    private redisService: RedisService,
  ) {}

  private every10minutesBusy = false;
  private every2hoursBusy = false;

  async onModuleInit() {
    if (!cluster.default.isPrimary) {
      return;
    }
    const client = this.redisService.getClient('DEFAULT_CLIENT');
    await client.flushdb();

    this.every10minutes();
    this.every2hours();
  }

  @Cron('0 */10 * * * *')
  async every10minutes() {
    if (!cluster.default.isPrimary) {
      return;
    }

    if (this.every10minutesBusy) {
      logger.warn('Skipping every10minutes schedule, it is already running');
      return;
    }

    this.every10minutesBusy = true;

    try {
      // await this.battleProcessor.process();
      await Promise.all([
        // this.marketProcessor.process(),
        this.plannerProcessor.process(),
      ]);
    } finally {
      this.every10minutesBusy = false;
    }
  }

  @Cron('0 5 */2 * * *')
  async every2hours() {
    if (!cluster.default.isPrimary) {
      return;
    }

    if (this.every2hoursBusy) {
      logger.warn('Skipping every2hours schedule, it is already running');
      return;
    }

    this.every2hoursBusy = true;

    try {
      //   await this.statsProcessor.process();
    } finally {
      this.every2hoursBusy = false;
    }
  }
}
