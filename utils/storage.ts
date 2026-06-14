import type { GameState, PersistedGameState, Player, Team, TeamId } from "@/types/game";
import { INITIAL_COACH_NAMES, INITIAL_TEAM_NAMES, MAX_ON_COURT } from "@/types/game";
import { generateJerseyNumber } from "@/utils/gameHelpers";
import { getTeamBadgeType } from "@/utils/teamBadge";

export const STORAGE_KEY = "basketball-scoreboard-state";

export function toPersistedState(state: GameState): PersistedGameState {
  const { undoStack, redoStack, ...persisted } = state;
  return persisted;
}

function defaultCoachForTeam(teamId: TeamId, teamName: string): string | null {
  const badge = getTeamBadgeType(teamName);
  if (teamId === "home" && badge === "ceara") return INITIAL_COACH_NAMES.home;
  if (teamId === "away" && badge === "fortaleza") return INITIAL_COACH_NAMES.away;
  return null;
}

function normalizePlayer(player: Player, team: Team, index: number): Player {
  const fouls = typeof player.fouls === "number" ? player.fouls : 0;
  const jerseyNumber =
    typeof player.jerseyNumber === "number"
      ? player.jerseyNumber
      : generateJerseyNumber(team);
  const onCourt =
    typeof player.onCourt === "boolean"
      ? player.onCourt
      : index < MAX_ON_COURT;

  return {
    ...player,
    fouls,
    jerseyNumber,
    onCourt,
    score: player.score ?? 0,
    baskets1: player.baskets1 ?? 0,
    baskets2: player.baskets2 ?? 0,
    baskets3: player.baskets3 ?? 0,
  };
}

function normalizeTeam(teamId: TeamId, team: Team): Team {
  const name = team.name ?? INITIAL_TEAM_NAMES[teamId];
  const coachName =
    team.coachName !== undefined
      ? team.coachName
      : defaultCoachForTeam(teamId, name);

  const normalized: Player[] = [];
  team.players.forEach((p, index) => {
    const stub: Team = { name, coachName, players: normalized };
    const np = normalizePlayer(p, stub, index);
    if (stub.players.some((x) => x.jerseyNumber === np.jerseyNumber && x.id !== np.id)) {
      np.jerseyNumber = generateJerseyNumber(stub);
    }
    normalized.push(np);
  });

  const onCourtCount = normalized.filter((p) => p.onCourt).length;
  if (onCourtCount === 0 && normalized.length > 0) {
    normalized.forEach((p, i) => {
      p.onCourt = i < MAX_ON_COURT;
    });
  } else if (onCourtCount > MAX_ON_COURT) {
    let court = 0;
    normalized.forEach((p) => {
      if (p.onCourt && court >= MAX_ON_COURT) p.onCourt = false;
      if (p.onCourt) court++;
    });
  }

  return { name, coachName, players: normalized };
}

function normalizePersistedState(state: PersistedGameState): PersistedGameState {
  return {
    ...state,
    teams: {
      home: normalizeTeam("home", state.teams.home),
      away: normalizeTeam("away", state.teams.away),
    },
    teamPeriodFouls: state.teamPeriodFouls ?? { home: 0, away: 0 },
  };
}

export function loadPersistedState(): PersistedGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizePersistedState(JSON.parse(raw) as PersistedGameState);
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedGameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
