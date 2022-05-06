import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import _ from 'lodash';

@Injectable()
export class SchedulerService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  private jobs: {
    [name: string]: {
      name: string;
      job: CronJob;
      active: boolean;
    };
  } = {};

  addCronJob(cronExpression: CronExpression, onTick: () => PromiseLike<any>) {
    const name = _.uniqueId();

    const wrappedOnTick = async () => {
      if (this.jobs[name].active) {
        logger.warn(`Skipped job ${name} as it is already active`);
        return;
      }

      this.jobs[name].active = true;

      try {
        await Promise.resolve(onTick());
      } catch (error) {
        logger.error(error);
        console.error(error);
      } finally {
        this.jobs[name].active = false;
      }
    };

    const job = new CronJob(cronExpression, wrappedOnTick);

    this.schedulerRegistry.addCronJob(name, job);

    this.jobs[name] = {
      name,
      job,
      active: false,
    };

    wrappedOnTick();
  }
}
