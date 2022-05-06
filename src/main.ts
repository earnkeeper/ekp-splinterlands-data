import { Cluster } from '@earnkeeper/ekp-sdk-nestjs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'module-alias/register';
import { MainModule } from './main.module';

const scheduleBootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(MainModule);
  app.enableShutdownHooks();
  await app.init();
};

Cluster.register(8, scheduleBootstrap);
