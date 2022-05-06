import { Job } from 'bull';
import _ from 'lodash';
import { BattleMapper, Card, Team } from '../../shared/game';

export default function process(job: Job): TeamResults[] {
  const { minBattles, battles, cardTemplatesMap } = job.data;

  const viableTeams: Record<string, TeamResults> = {};

  for (const battle of battles) {
    const { winner, loser } = BattleMapper.mapToWinnerAndLoser(
      battle,
      cardTemplatesMap,
    );

    updateResultsWith(viableTeams, winner, battle.rulesets, true);
    updateResultsWith(viableTeams, loser, battle.rulesets, false);
  }

  return _.values(viableTeams).filter((it) => it.battles >= minBattles);
}

function updateResultsWith(
  viableTeams: Record<string, TeamResults>,
  team: Team,
  rulesets: string[],
  win: boolean,
) {
  const id: string = mapTeamId(team, rulesets);

  let viableTeam = viableTeams[id];

  if (!viableTeam) {
    viableTeams[id] = viableTeam = createTeamResults(id, team, rulesets);
  }

  if (win) {
    viableTeam.wins += 1;
  }

  viableTeam.battles += 1;
}

function createTeamResults(
  teamId: string,
  team: Team,
  rulesets: string[],
): TeamResults {
  return {
    id: teamId,
    rulesets,
    wins: 0,
    battles: 0,
    summoner: team.summoner,
    monsters: team.monsters,
  };
}

function mapTeamId(team: Team, rulesets: string[]): string {
  const orderedMonstersId = _.chain(team.monsters)
    .map((monster) => monster.hash)
    .sort()
    .join(',')
    .value();

  const orderedRulesets = _.chain(rulesets).sort().join(';').value();

  return `${team.summoner.hash},${orderedMonstersId},${orderedRulesets}`;
}

export type TeamResults = {
  readonly id: string;
  battles: number;
  wins: number;
  readonly rulesets: string[];
  readonly summoner: Card;
  readonly monsters: Card[];
};
