import { BattleRepository, PlannerTeamRepository } from '@/shared/db';
import { PlannerTeam } from '@/shared/db/plannerTeam';
import { CardService, LEAGUE_GROUPS } from '@/shared/game';
import { FREE_DAYS_TO_KEEP, PREMIUM_DAYS_TO_KEEP } from '@/util';
import { ApmService, logger } from '@earnkeeper/ekp-sdk-nestjs';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';
import _ from 'lodash';
import moment from 'moment';
import getTeamResults from './results';

@Injectable()
@Processor('planner')
export class PlannerProcessor {
  constructor(
    private apmService: ApmService,
    private battleRepository: BattleRepository,
    private plannerTeamRepository: PlannerTeamRepository,
    private cardService: CardService,
    @InjectQueue('planner') private plannerQueue: Queue,
  ) {}

  @Process()
  async processTeams(job: Job) {
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

            await this.plannerQueue.add({
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
      this.apmService.captureError(error);
      console.error(error);
      logger.error(error);
    }
  }
}
