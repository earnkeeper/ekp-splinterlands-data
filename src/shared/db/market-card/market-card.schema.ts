import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketCardDocument = MarketCard & Document;

@Schema({ collection: 'market_card' })
export class MarketCard {
  @Prop()
  readonly id: string;

  @Prop()
  readonly hash: string;

  @Prop()
  blockNumber: number;

  @Prop()
  readonly level: number;

  @Prop()
  readonly templateId: number;

  @Prop()
  readonly gold: boolean;

  @Prop()
  readonly editionNumber: number;

  @Prop({ type: 'array' })
  readonly daily: DailyBattleStats[];
}

export const MarketCardSchema = SchemaFactory.createForClass(MarketCard)
  .index({ id: 1 }, { unique: true })
  .index({ blockNumber: 1 });

export type DailyBattleStats = {
  battles: number;
  readonly day: string;
  readonly leagueGroup: string;
  wins: number;
};
