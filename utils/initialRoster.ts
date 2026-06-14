import type { Player, Team, TeamId } from "@/types/game";
import { INITIAL_COACH_NAMES, INITIAL_TEAM_NAMES } from "@/types/game";
import { createId } from "@/utils/gameHelpers";

type DefaultPlayerSeed = {
  name: string;
  jerseyNumber: number;
};

const DEFAULT_HOME_PLAYERS: DefaultPlayerSeed[] = [
  { name: "Vina", jerseyNumber: 29 },
  { name: "Richardson", jerseyNumber: 6 },
  { name: "Fernandinho", jerseyNumber: 77 },
  { name: "Luiz Otávio", jerseyNumber: 13 },
  { name: "Richard", jerseyNumber: 1 },
];

const DEFAULT_AWAY_PLAYERS: DefaultPlayerSeed[] = [
  { name: "João Ricardo", jerseyNumber: 1 },
  { name: "Pikachu", jerseyNumber: 22 },
  { name: "Tinga", jerseyNumber: 2 },
  { name: "Titi", jerseyNumber: 4 },
  { name: "Pochettino", jerseyNumber: 7 },
];

function createDefaultPlayer(seed: DefaultPlayerSeed): Player {
  return {
    id: createId(),
    name: seed.name,
    jerseyNumber: seed.jerseyNumber,
    onCourt: true,
    score: 0,
    baskets1: 0,
    baskets2: 0,
    baskets3: 0,
    fouls: 0,
  };
}

function createDefaultTeam(teamId: TeamId, seeds: DefaultPlayerSeed[]): Team {
  return {
    name: INITIAL_TEAM_NAMES[teamId],
    coachName: INITIAL_COACH_NAMES[teamId],
    players: seeds.map(createDefaultPlayer),
  };
}

export function createDefaultTeams(): Record<TeamId, Team> {
  return {
    home: createDefaultTeam("home", DEFAULT_HOME_PLAYERS),
    away: createDefaultTeam("away", DEFAULT_AWAY_PLAYERS),
  };
}
