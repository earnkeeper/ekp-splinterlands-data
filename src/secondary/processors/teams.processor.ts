import { PlannerTeamRepository } from '@/shared/db';
import { PlannerTeam } from '@/shared/db/plannerTeam';
import { BattleMapper, Card, Team } from '@/shared/game';
import { logger } from '@earnkeeper/ekp-sdk-nestjs';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import _ from 'lodash';
import moment from 'moment';

@Processor('teams')
export class TeamsProcessor {
  constructor(private plannerTeamRepository: PlannerTeamRepository) {}

  @Process()
  async process(job: Job) {
    try {
      const {
        manaCap,
        leagueGroup,
        battles,
        updated,
        cardTemplatesMap,
        plannerTeams,
      } = job.data;

      logger.debug(
        `Processing ${battles.length} battles for ${leagueGroup} (${manaCap})`,
      );

      const plannerTeamMap = _.chain(plannerTeams).keyBy('id').value();

      for (const battle of battles) {
        const { winner, loser } = BattleMapper.mapToWinnerAndLoser(
          battle,
          cardTemplatesMap,
        );

        const dayId = moment
          .unix(battle.timestamp)
          .startOf('day')
          .format('YYYY-MM-DD');

        this.updateResultsWith(
          plannerTeamMap,
          winner,
          battle.rulesets,
          true,
          updated,
          manaCap,
          leagueGroup,
          dayId,
          battle.timestamp,
        );

        this.updateResultsWith(
          plannerTeamMap,
          loser,
          battle.rulesets,
          false,
          updated,
          manaCap,
          leagueGroup,
          dayId,
          battle.timestamp,
        );
      }

      const teamDocuments = _.values(plannerTeamMap);

      await this.plannerTeamRepository.save(teamDocuments);

      logger.debug(
        `Finished processing ${teamDocuments.length} teams for ${leagueGroup} (${manaCap})`,
      );
    } catch (error) {
      logger.error(error);
      console.error(error);
    }
  }

  updateResultsWith(
    plannerTeams: Record<string, PlannerTeam>,
    team: Team,
    rulesets: string[],
    win: boolean,
    updated: number,
    manaCap: number,
    leagueGroup: string,
    dayId: string,
    timestamp: number,
  ) {
    const id: string = this.mapTeamId(team, rulesets);

    let plannerTeam = plannerTeams[id];

    if (!plannerTeam) {
      plannerTeams[id] = plannerTeam = this.createPlannerTeam(
        updated,
        id,
        team,
        rulesets,
        manaCap,
        leagueGroup,
      );
    }

    if (!plannerTeam.daily[dayId]) {
      plannerTeam.daily[dayId] = {
        wins: 0,
        battles: 0,
      };
    }

    plannerTeam.daily[dayId].battles++;

    if (win) {
      plannerTeam.daily[dayId].wins++;
    }

    if (timestamp > plannerTeam.latestTimestamp) {
      plannerTeam.latestTimestamp = timestamp;
    }

    plannerTeam.latestTimestamp = timestamp;
  }

  createPlannerTeam(
    updated: number,
    teamId: string,
    team: Team,
    rulesets: string[],
    manaCap: number,
    leagueGroup: string,
  ): PlannerTeam {
    return {
      id: teamId,
      updated,
      rulesets,
      summoner: team.summoner,
      monsters: team.monsters,
      manaCap,
      latestTimestamp: 0,
      daily: {},
      leagueGroup,
    };
  }

  mapTeamId(team: Team, rulesets: string[]): string {
    const orderedMonstersId = _.chain(team.monsters)
      .map((monster) => monster.hash)
      .sort()
      .join(',')
      .value();

    const orderedRulesets = _.chain(rulesets).sort().join(';').value();

    return `${team.summoner.hash},${orderedMonstersId},${orderedRulesets}`;
  }
}

export type TeamResults = {
  readonly id: string;
  battles: number;
  wins: number;
  readonly rulesets: string[];
  readonly summoner: Card;
  readonly monsters: Card[];
};
