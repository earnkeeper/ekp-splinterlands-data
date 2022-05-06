import { Cluster } from '@earnkeeper/ekp-sdk-nestjs';
import { NestFactory } from '@nestjs/core';
import * as cluster from 'cluster';
import 'module-alias/register';
import * as os from 'os';
import { PrimaryModule } from './primary/primary.module';
import { SecondaryModule } from './secondary/secondary.module';

export async function runCluster() {
  const bootstrap = async () => {
    if (cluster.default.isPrimary) {
      const app = await NestFactory.create(PrimaryModule);
      app.enableShutdownHooks();
      await app.init();
    } else {
      const app = await NestFactory.create(SecondaryModule);
      app.enableShutdownHooks();
      await app.init();
    }
  };

  Cluster.register(os.cpus().length - 1, bootstrap);
}

runCluster();
