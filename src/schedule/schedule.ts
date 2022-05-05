import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Cron } from '@nestjs/schedule';
import { BattleProcessor } from './battle.processor';
import { CardProcessor } from './card.processor';
import { StatsProcessor } from './stats.processor';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduleService {
  constructor(
    private battleProcessor: BattleProcessor,
    private cardProcessor: CardProcessor,
    private statsProcessor: StatsProcessor,
  ) {}

  private every10minutesBusy = false;
  private every2hoursBusy = false;

  async onModuleInit() {
    await this.every10minutes();
    await this.every2hours();
  }

  @Cron('0 */10 * * * *')
  async every10minutes() {
    if (this.every10minutesBusy) {
      logger.warn('Skipping every10minutes schedule, it is already running');
      return;
    }
    this.every10minutesBusy = true;
    try {
      await this.battleProcessor.fetchBattleTransactions();
      await this.cardProcessor.groupCards();
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
      await this.statsProcessor.processBattleStats();
    } finally {
      this.every2hoursBusy = false;
    }
  }
}
