import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Battle, BattleRepository, BattleSchema } from './battle';
import { Ign, IgnRepository, IgnSchema } from './ign';
import {
  PlannerTeam,
  PlannerTeamRepository,
  PlannerTeamSchema,
} from './plannerTeam';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Battle.name, schema: BattleSchema },
      { name: Ign.name, schema: IgnSchema },
      { name: PlannerTeam.name, schema: PlannerTeamSchema },
    ]),
  ],
  providers: [BattleRepository, IgnRepository, PlannerTeamRepository],
  exports: [BattleRepository, IgnRepository, PlannerTeamRepository],
})
export class DbModule {}
