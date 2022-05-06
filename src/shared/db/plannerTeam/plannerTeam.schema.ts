import { Card } from '@/shared/game';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlannerTeamDocument = PlannerTeam & Document;

@Schema({ collection: 'planner_team_v2' })
export class PlannerTeam {
  @Prop({ index: true })
  readonly id: string;

  @Prop()
  readonly battles: number;

  @Prop()
  readonly wins: number;

  @Prop([String])
  readonly rulesets: string[];

  @Prop({ type: 'object' })
  readonly summoner: Card;

  @Prop({ type: 'array' })
  readonly monsters: Card[];

  @Prop({ type: Date })
  readonly battlesStart: Date;

  @Prop()
  readonly manaCap: number;

  @Prop()
  readonly leagueGroup: string;

  @Prop()
  readonly subscribed: boolean;

  @Prop()
  readonly battlesTotal: number;
}

export const PlannerTeamSchema = SchemaFactory.createForClass(PlannerTeam)
  .index({ manaCap: 1, leagueGroup: 1, subscribed: 1 })
  .index(
    { id: 1, manaCap: 1, leagueGroup: 1, subscribed: 1 },
    { unique: true },
  );
