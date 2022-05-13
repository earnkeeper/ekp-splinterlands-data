import { Card } from '@/shared/game';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlannerTeamDocument = PlannerTeam & Document;

@Schema({ collection: 'planner_team_v6' })
export class PlannerTeam {
  @Prop({ type: String })
  readonly id: string;

  @Prop()
  readonly created: number;

  @Prop()
  updated: number;

  @Prop([String])
  readonly rulesets: string[];

  @Prop({ type: 'object' })
  readonly summoner: Card;

  @Prop({ type: 'array' })
  readonly monsters: Card[];

  @Prop({ type: Number })
  readonly manaCap: number;

  @Prop({ type: Number })
  battles: number;

  @Prop({ type: Number })
  wins: number;

  @Prop({ type: String })
  readonly leagueGroup: string;

  @Prop()
  latestTimestamp: number;

  @Prop({ type: 'object' })
  readonly daily: {
    [day: string]: {
      wins: number;
      battles: number;
    };
  };
}

export const PlannerTeamSchema = SchemaFactory.createForClass(PlannerTeam)
  .index({ manaCap: 1, leagueGroup: 1 })
  .index({ id: 1, manaCap: 1, leagueGroup: 1 }, { unique: true });
