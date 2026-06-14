import type {
  GameSnapshot,
  MatchStatus,
  Player,
  PlayerSortKey,
  Team,
  TeamId,
} from "@/types/game";
import {
  MAX_ON_COURT,
  MAX_PLAYER_FOULS,
  MIN_PLAYERS_TO_START,
  PERIOD_COUNT,
  PERIOD_DURATION_SECONDS,
} from "@/types/game";
import { createDefaultTeams } from "@/utils/initialRoster";

export function isPlayerExpelled(player: Player): boolean {
  return player.fouls >= MAX_PLAYER_FOULS;
}

/** Apenas com cronômetro rodando. */
export function isMatchActiveForPlay(status: MatchStatus): boolean {
  return status === "running";
}

/** Substituições permitidas antes do jogo ou com cronômetro pausado. */
export function canSubstitute(status: MatchStatus): boolean {
  return status === "idle" || status === "paused";
}

export function getSubstitutionDisabledReason(status: MatchStatus): string {
  if (status === "running") return "Pause o cronômetro para substituir";
  if (status === "finished") return "Partida encerrada";
  return "";
}

export function canPlayerScore(player: Player, matchStatus: MatchStatus): boolean {
  return (
    isMatchActiveForPlay(matchStatus) &&
    player.onCourt &&
    !isPlayerExpelled(player)
  );
}

export function canPlayerReceiveFoul(player: Player, matchStatus: MatchStatus): boolean {
  return (
    isMatchActiveForPlay(matchStatus) &&
    player.onCourt &&
    !isPlayerExpelled(player)
  );
}

export function getPlayActionDisabledReason(
  player: Player,
  matchStatus: MatchStatus
): string {
  if (isPlayerExpelled(player)) return "Jogador expulso";
  if (!player.onCourt) return "Apenas jogadores em quadra";
  if (matchStatus === "idle") return "Inicie a partida";
  if (matchStatus === "paused") return "Cronômetro pausado";
  if (matchStatus === "finished") return "Partida encerrada";
  return "";
}

export function formatJerseyNumber(n: number): string {
  return String(n);
}

export function countOnCourt(team: Team): number {
  return team.players.filter((p) => p.onCourt).length;
}

export function canStartMatch(teams: Record<TeamId, Team>): boolean {
  return (
    teams.home.players.length >= MIN_PLAYERS_TO_START &&
    teams.away.players.length >= MIN_PLAYERS_TO_START
  );
}

export function generateJerseyNumber(team: Team): number {
  const used = new Set(team.players.map((p) => p.jerseyNumber));
  const available: number[] = [];
  for (let n = 0; n <= 99; n++) {
    if (!used.has(n)) available.push(n);
  }
  if (available.length === 0) return 0;
  return available[Math.floor(Math.random() * available.length)];
}

export function sortPlayers(players: Player[], sortKey: PlayerSortKey): Player[] {
  return [...players].sort((a, b) => {
    switch (sortKey) {
      case "score":
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name, "pt-BR");
      case "name":
        return a.name.localeCompare(b.name, "pt-BR");
      case "jersey":
        if (a.jerseyNumber !== b.jerseyNumber) return a.jerseyNumber - b.jerseyNumber;
        return a.name.localeCompare(b.name, "pt-BR");
      case "fouls":
        if (b.fouls !== a.fouls) return b.fouls - a.fouls;
        return a.name.localeCompare(b.name, "pt-BR");
      default:
        return 0;
    }
  });
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTeamScore(team: Team): number {
  return team.players.reduce((sum, p) => sum + p.score, 0);
}

export function createInitialPeriodScores(): { home: number[]; away: number[] } {
  return {
    home: Array(PERIOD_COUNT).fill(0),
    away: Array(PERIOD_COUNT).fill(0),
  };
}

export function createInitialTeamPeriodFouls(): { home: number; away: number } {
  return { home: 0, away: 0 };
}

export function createInitialSnapshot(): GameSnapshot {
  const teams = createDefaultTeams();
  return {
    teams: {
      home: {
        name: teams.home.name,
        coachName: teams.home.coachName,
        players: teams.home.players.map((p) => ({ ...p })),
      },
      away: {
        name: teams.away.name,
        coachName: teams.away.coachName,
        players: teams.away.players.map((p) => ({ ...p })),
      },
    },
    match: {
      status: "idle",
      currentPeriod: 1,
      timeRemainingSeconds: PERIOD_DURATION_SECONDS,
    },
    periodScores: createInitialPeriodScores(),
    teamPeriodFouls: createInitialTeamPeriodFouls(),
    actionLog: [],
  };
}

export function snapshotFromState(state: {
  teams: GameSnapshot["teams"];
  match: GameSnapshot["match"];
  periodScores: GameSnapshot["periodScores"];
  teamPeriodFouls: GameSnapshot["teamPeriodFouls"];
  actionLog: GameSnapshot["actionLog"];
}): GameSnapshot {
  return {
    teams: {
      home: {
        name: state.teams.home.name,
        coachName: state.teams.home.coachName,
        players: state.teams.home.players.map((p) => ({ ...p })),
      },
      away: {
        name: state.teams.away.name,
        coachName: state.teams.away.coachName,
        players: state.teams.away.players.map((p) => ({ ...p })),
      },
    },
    match: { ...state.match },
    periodScores: {
      home: [...state.periodScores.home],
      away: [...state.periodScores.away],
    },
    teamPeriodFouls: { ...state.teamPeriodFouls },
    actionLog: [...state.actionLog],
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function findTopScorer(
  teams: Record<TeamId, Team>
): { teamId: TeamId; player: Player } | null {
  let best: { teamId: TeamId; player: Player } | null = null;
  (["home", "away"] as TeamId[]).forEach((teamId) => {
    teams[teamId].players.forEach((player) => {
      if (!best || player.score > best.player.score) {
        best = { teamId, player };
      }
    });
  });
  return best;
}

export function getWinner(
  teams: Record<TeamId, Team>
): { teamId: TeamId; name: string; score: number } | "tie" | null {
  const homeScore = getTeamScore(teams.home);
  const awayScore = getTeamScore(teams.away);
  if (homeScore === awayScore) {
    if (homeScore === 0 && awayScore === 0) return null;
    return "tie";
  }
  if (homeScore > awayScore) {
    return { teamId: "home", name: teams.home.name, score: homeScore };
  }
  return { teamId: "away", name: teams.away.name, score: awayScore };
}

export function needsSubstitution(team: Team): boolean {
  const onCourt = countOnCourt(team);
  const eligibleOnCourt = team.players.filter(
    (p) => p.onCourt && !isPlayerExpelled(p)
  ).length;
  return onCourt < MAX_ON_COURT || eligibleOnCourt < Math.min(MAX_ON_COURT, onCourt);
}
