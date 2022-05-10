import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Battle, BattleRepository, BattleSchema } from './battle';
import { Ign, IgnRepository, IgnSchema } from './ign';
import { MarketCard, MarketCardSchema } from './market-card';
import { MarketCardRepository } from './market-card/market-card.repository';
import {
  PlannerTeam,
  PlannerTeamRepository,
  PlannerTeamSchema,
} from './planner-team';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Battle.name, schema: BattleSchema },
      { name: Ign.name, schema: IgnSchema },
      { name: PlannerTeam.name, schema: PlannerTeamSchema },
      { name: MarketCard.name, schema: MarketCardSchema },
    ]),
  ],
  providers: [
    BattleRepository,
    IgnRepository,
    PlannerTeamRepository,
    MarketCardRepository,
  ],
  exports: [
    BattleRepository,
    IgnRepository,
    PlannerTeamRepository,
    MarketCardRepository,
  ],
})
export class DbModule {}
