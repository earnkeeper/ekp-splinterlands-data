import { PlannerTeamRepository } from '@/shared/db';
import { PlannerTeam } from '@/shared/db/plannerTeam';
import { LEAGUE_GROUPS, ResultsService } from '@/shared/game';
import { ApmService, logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';

@Injectable()
export class PlannerProcessor {
  constructor(
    private apmService: ApmService,
    private resultsService: ResultsService,
    private plannerTeamRepository: PlannerTeamRepository,
  ) {}
  async process() {
    try {
      const manaCaps: number[] = _.chain(_.range(12, 50)).union([99]).value();
      const leagueGroups = _.chain(LEAGUE_GROUPS)
        .map((it) => it.name)
        .union(['All'])
        .value();

      const subscribed = true;

      for (const manaCap of manaCaps) {
        await Promise.all(
          leagueGroups.map(async (leagueGroup) => {
            logger.debug(`Fetching battles for ${leagueGroup} (${manaCap})`);

            const { teams, battles } = await this.resultsService.getTeamResults(
              manaCap,
              leagueGroup,
              subscribed,
              5,
            );

            logger.debug(
              `Processing ${battles.length} for ${leagueGroup} (${manaCap})`,
            );

            const teamDocuments = _.chain(teams)
              .map((team) => {
                const document: PlannerTeam = {
                  battles: team.battles,
                  wins: team.wins,
                  rulesets: team.rulesets,
                  summoner: team.summoner,
                  monsters: team.monsters,
                  manaCap,
                  leagueGroup,
                  subscribed,
                  battlesTotal: battles?.length,
                  battlesStart: battles[0]?.timestampDate,
                };
                return document;
              })
              .value();

            await this.plannerTeamRepository.save(teamDocuments);

            logger.debug(
              `Finished processing teams for ${leagueGroup} (${manaCap})`,
            );
          }),
        );
      }
    } catch (error) {
      this.apmService.captureError(error);
      console.error(error);
      logger.error(error);
    }
  }
}
