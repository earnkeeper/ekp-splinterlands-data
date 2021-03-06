import { ApiService } from '@/shared/api';
import {
  BattleRepository,
  BATTLE_VERSION,
  Ign,
  IgnRepository,
} from '@/shared/db';
import { BattleMapper, CardService } from '@/shared/game';
import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Process, Processor } from '@nestjs/bull';
import { validate } from 'bycontract';
import _ from 'lodash';
import moment from 'moment';

@Processor('battles')
export class BattleProcessor {
  constructor(
    private apiService: ApiService,
    private battleRepository: BattleRepository,
    private cardService: CardService,
    private ignRepository: IgnRepository,
  ) {}

  @Process()
  async process() {
    try {
      await this.storeBattleIgns();
      await this.storeLeaderIgns();
      await this.fetchIgnBattles();
    } catch (error) {
      console.error(error);
      logger.error(error);
    }
  }

  async fetchIgnBattles() {
    const ago = moment().subtract(2, 'hours').unix();

    const igns: Ign[] = _.chain(
      await Promise.all([
        this.ignRepository.findUpdatedEmpty(1000),
        this.ignRepository.findUpdatedLessThan(ago, 1000),
      ]),
    )
      .flatMap((it) => it)
      .uniqBy('id')
      .value();

    const cardTemplatesMap = await this.cardService.getAllCardTemplatesMap();

    for (const ign of igns) {
      const playerBattles = await this.apiService.fetchPlayerBattles(ign.id);

      if (
        !Array.isArray(playerBattles?.battles) ||
        playerBattles.battles.length === 0
      ) {
        await this.ignRepository.delete(ign.id);
        return;
      }

      const battles = BattleMapper.mapBattlesFromPlayer(
        playerBattles.battles,
        cardTemplatesMap,
        BATTLE_VERSION,
        moment(),
      );

      await this.battleRepository.save(battles);

      ign.updated = moment().unix();

      logger.log(
        `Saved ${battles?.length} battles from player ${ign.id} to the db.`,
      );
    }

    await this.ignRepository.save(igns);
  }

  async storeBattleIgns() {
    const transactions = await this.apiService.fetchBattleTransactions();

    if (!transactions?.length) {
      return;
    }

    const igns = _.chain(transactions)
      .flatMap((transaction) => [
        transaction.affected_player,
        transaction.player,
      ])
      .uniq()
      .map((name) => ({ id: name }))
      .value();

    await this.ignRepository.save(igns);
  }

  async storeLeaderIgns() {
    const settings = await this.apiService.fetchSettings();
    validate(settings?.season?.id, 'number');

    for (let leagueNumber = 0; leagueNumber <= 6; leagueNumber++) {
      const currentSeason = settings.season.id;

      const leagueLeaderboard = await this.apiService.fetchLeaderboard(
        currentSeason,
        leagueNumber,
      );

      const igns = leagueLeaderboard.leaderboard.map((it) => ({
        id: it.player,
      }));

      await this.ignRepository.save(igns);
    }
  }
}
