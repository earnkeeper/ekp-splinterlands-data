import {
  Battle,
  BattleRepository,
  MarketCard,
  MarketCardRepository,
} from '@/shared/db';
import { Card, CardService } from '@/shared/game';
import { BattleMapper } from '@/shared/game/mappers/battle.mapper';
import { PREMIUM_DAYS_TO_KEEP } from '@/util';
import { ApmService, logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Process, Processor } from '@nestjs/bull';
import _ from 'lodash';
import moment from 'moment';

@Processor('market')
export class MarketCardProcessor {
  constructor(
    private apmService: ApmService,
    private battleRepository: BattleRepository,
    private marketCardRepository: MarketCardRepository,
    private cardService: CardService,
  ) {}

  @Process()
  async process() {
    try {
      const battlePageSize = 10000;

      const records = await this.marketCardRepository.findAll();

      const now = moment();

      // Remove stale statistics
      for (const record of records) {
        _.remove(
          record.daily,
          (it) => now.diff(moment(it.day), 'days') > PREMIUM_DAYS_TO_KEEP,
        );
      }

      let latestBlock = _.chain(records)
        .maxBy('blockNumber')
        .get('blockNumber', 0)
        .value();

      const recordMap = _.chain(records)
        .keyBy((it) => it.id)
        .value();

      while (true) {
        const battles: Battle[] =
          await this.battleRepository.findAllAfterBlockNumber(
            latestBlock,
            battlePageSize,
          );

        if (battles.length === 0) {
          break;
        }

        const latestBattle = _.chain(battles).maxBy('timestamp').value();

        logger.debug(
          `Read ${battles?.length} battles up to ${moment.unix(
            latestBattle.timestamp,
          )}, updating cards`,
        );

        await this.getCardsFromBattles(recordMap, battles);

        const updatedCards = _.values(recordMap);

        await this.marketCardRepository.save(updatedCards);

        logger.debug(`Saved ${updatedCards?.length} cards to the database`);

        if (battles.length < battlePageSize) {
          break;
        }

        latestBlock = latestBattle.blockNumber;
      }
    } catch (error) {
      this.apmService.captureError(error);
      logger.error(error);
    }
  }

  private async getCardsFromBattles(
    recordMap: Record<string, MarketCard>,
    battles: Battle[],
  ) {
    const sortedBattles = _.chain(battles).sortBy('blockNumber').value();

    const cardTemplatesMap = await this.cardService.getAllCardTemplatesMap();

    for (const battle of sortedBattles) {
      const { winner, loser } = BattleMapper.mapToWinnerAndLoser(
        battle,
        cardTemplatesMap,
      );

      const battleDate = moment.unix(battle.timestamp).format('YYYY-MM-DD');

      const winnerCards: Card[] = [winner.summoner, ...winner.monsters];

      const loserCards: Card[] = [loser.summoner, ...loser.monsters];

      const allBattleCards = _.chain(winnerCards)
        .unionWith(loserCards, (a, b) => a.hash === b.hash)
        .value();

      for (const card of allBattleCards) {
        let record = recordMap[card.hash];

        if (!record) {
          record = this.createRecord(card);
          recordMap[record.id] = record;
        }

        record.blockNumber = battle.blockNumber;

        let dailyRecord = record.daily.find(
          (it) =>
            it.day === battleDate && it.leagueGroup === battle.leagueGroup,
        );

        if (!dailyRecord) {
          dailyRecord = {
            day: battleDate,
            leagueGroup: battle.leagueGroup,
            wins: 0,
            battles: 0,
          };
          record.daily.push(dailyRecord);
        }

        dailyRecord.battles++;

        const winnerHasCard = _.some(
          winnerCards,
          (it) => it.hash === card.hash,
        );

        if (winnerHasCard) {
          dailyRecord.wins++;
        }
      }
    }

    return _.values(recordMap);
  }

  private createRecord(card: Card): MarketCard {
    const record: MarketCard = {
      id: card.hash,
      blockNumber: 0,
      daily: [],
      editionNumber: card.editionNumber,
      gold: card.gold,
      hash: card.hash,
      level: card.level,
      templateId: card.templateId,
    };
    return record;
  }
}
