import { PlannerTeamRepository } from '@/shared/db';
import { PlannerTeam } from '@/shared/db/plannerTeam';
import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import _ from 'lodash';
import getTeamResults from './results';

@Processor('teams')
export class TeamsProcessor {
  constructor(private plannerTeamRepository: PlannerTeamRepository) {}

  @Process()
  async process(job: Job) {
    const { manaCap, leagueGroup, subscribed, battles, updated } = job.data;

    logger.debug(
      `Processing ${battles.length} battles for ${leagueGroup} (${manaCap})`,
    );

    const teams = getTeamResults(job);

    const teamDocuments = _.chain(teams)
      .map((team) => {
        const document: PlannerTeam = {
          id: team.id,
          updated: updated,
          battles: team.battles,
          wins: team.wins,
          rulesets: team.rulesets,
          summoner: team.summoner,
          monsters: team.monsters,
          manaCap,
          leagueGroup,
          subscribed,
          battlesTotal: battles?.length,
          battlesStart: _.chain(battles)
            .map((it) => it.timestamp)
            .min()
            .value(),
        };
        return document;
      })
      .value();

    await this.plannerTeamRepository.save(teamDocuments);

    logger.debug(
      `Finished processing ${teams.length} teams for ${leagueGroup} (${manaCap})`,
    );
  }
}
