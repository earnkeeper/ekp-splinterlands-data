import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BattleProcessor } from './processors/battle.processor';
import { PlannerProcessor } from './processors/planner.processor';

@Injectable()
export class SchedulerService {
  constructor(
    private battleProcessor: BattleProcessor,
    private plannerProcessor: PlannerProcessor,
  ) {}

  private every10minutesBusy = false;
  private every2hoursBusy = false;

  async onModuleInit() {
    this.every10minutes();
    this.every2hours();
  }

  @Cron('0 */10 * * * *')
  async every10minutes() {
    if (this.every10minutesBusy) {
      logger.warn('Skipping every10minutes schedule, it is already running');
      return;
    }

    this.every10minutesBusy = true;

    try {
      await this.battleProcessor.process();
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
