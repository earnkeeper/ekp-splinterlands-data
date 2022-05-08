import { Module } from '@nestjs/common';
import { ApiModule } from '../api';
import { DbModule } from '../db';
import { CardService, MarketService } from './services';

@Module({
  imports: [ApiModule, DbModule],
  providers: [CardService, MarketService, CardService],
  exports: [CardService, MarketService, CardService],
})
export class GameModule {}
