import { BattleRepository, PlannerTeamRepository } from '@/shared/db';
import { CardService, LEAGUE_GROUPS } from '@/shared/game';
import { FREE_DAYS_TO_KEEP, PREMIUM_DAYS_TO_KEEP } from '@/util';
import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue } from 'bull';
import _ from 'lodash';
import moment from 'moment';

@Processor('planner')
export class PlannerProcessor {
  constructor(
    private battleRepository: BattleRepository,
    private plannerTeamRepository: PlannerTeamRepository,
    private cardService: CardService,
    @InjectQueue('teams') private teamsQueue: Queue,
  ) {}

  @Process()
  async process() {
    const updated = moment().unix();

    try {
      const manaCaps: number[] = _.chain(_.range(12, 50)).union([99]).value();

      const leagueGroups = _.chain(LEAGUE_GROUPS)
        .map((it) => it.name)
        .union(['All'])
        .value();

      const subscribed = true;

      const cardTemplatesMap = await this.cardService.getAllCardTemplatesMap();

      for (const manaCap of manaCaps) {
        await Promise.all(
          leagueGroups.map(async (leagueGroup) => {
            logger.debug(`Fetching battles for ${leagueGroup} (${manaCap})`);

            const fetchSince = !subscribed
              ? moment().subtract(FREE_DAYS_TO_KEEP, 'days').unix()
              : moment().subtract(PREMIUM_DAYS_TO_KEEP, 'days').unix();

            const battles = await this.battleRepository.findBattleByManaCap(
              manaCap,
              leagueGroup,
              fetchSince,
            );

            await this.teamsQueue.add({
              minBattles: 2,
              battles,
              cardTemplatesMap,
              manaCap,
              leagueGroup,
              subscribed,
              updated,
            });
          }),
        );
      }

      await this.plannerTeamRepository.deleteBefore(updated);
    } catch (error) {
      console.error(error);
      logger.error(error);
    }
  }
}
