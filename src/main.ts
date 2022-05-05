import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'module-alias/register';
import { ScheduleApp } from './schedule.app';

const scheduleBootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(ScheduleApp);
  app.enableShutdownHooks();
  await app.init();
};

scheduleBootstrap();
