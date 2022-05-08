import { BattleRepository, PlannerTeamRepository } from '@/shared/db';
import { CardService, LEAGUE_GROUPS } from '@/shared/game';
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

      const cardTemplatesMap = await this.cardService.getAllCardTemplatesMap();

      for (const manaCap of manaCaps) {
        await Promise.all(
          leagueGroups.map(async (leagueGroup) => {
            logger.debug(`Fetching battles for ${leagueGroup} (${manaCap})`);

            const BATTLE_LIMIT = 5000;

            while (true) {
              const plannerTeams =
                await this.plannerTeamRepository.findByLeagueGroupAndManaCap(
                  leagueGroup,
                  manaCap,
                );

              let latestTimestamp = 0;

              if (!!plannerTeams?.length) {
                latestTimestamp = _.chain(plannerTeams)
                  .maxBy('latestTimestamp')
                  .get('latestTimestamp')
                  .value();
              }

              const battles = await this.battleRepository.findBattleByManaCap(
                manaCap,
                leagueGroup,
                latestTimestamp,
                BATTLE_LIMIT,
              );

              if (battles.length === 0) {
                logger.debug(
                  `No more battles found for ${leagueGroup} (${manaCap})`,
                );
                break;
              }

              await this.teamsQueue.add({
                battles,
                cardTemplatesMap,
                manaCap,
                leagueGroup,
                updated,
                plannerTeams,
              });

              if (battles.length < BATTLE_LIMIT) {
                logger.debug(
                  `No more battles found for ${leagueGroup} (${manaCap})`,
                );
                break;
              }
            }
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
