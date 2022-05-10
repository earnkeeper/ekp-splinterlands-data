import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'bycontract';
import { Model } from 'mongoose';
import { MarketCard } from './market-card.schema';

@Injectable()
export class MarketCardRepository {
  constructor(
    @InjectModel(MarketCard.name)
    public cardModel: Model<MarketCard>,
  ) {}

  async findAll(): Promise<MarketCard[]> {
    const results = await this.cardModel.find().exec();

    return results ?? [];
  }

  async save(cards: MarketCard[]): Promise<void> {
    validate([cards], ['Array.<object>']);

    if (cards.length === 0) {
      return;
    }

    await this.cardModel.bulkWrite(
      cards.map((model) => {
        validate(model, 'object');
        return {
          updateOne: {
            filter: {
              id: model.id,
            },
            update: {
              $set: model,
            },
            upsert: true,
          },
        };
      }),
    );
  }
}
