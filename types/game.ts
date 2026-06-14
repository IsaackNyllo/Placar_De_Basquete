export type TeamId = "home" | "away";

export type Player = {
  id: string;
  name: string;
  jerseyNumber: number;
  onCourt: boolean;
  score: number;
  baskets1: number;
  baskets2: number;
  baskets3: number;
  fouls: number;
};

export const MAX_PLAYER_FOULS = 5;
export const MIN_PLAYERS_TO_START = 5;
export const MAX_ON_COURT = 5;

export type Team = {
  name: string;
  coachName: string | null;
  players: Player[];
};

export type MatchStatus = "idle" | "running" | "paused" | "finished";

export type PlayerSortKey = "score" | "name" | "jersey" | "fouls";

export type HistoryActionType =
  | "TEAM_RENAMED"
  | "PLAYER_ADDED"
  | "PLAYER_REMOVED"
  | "PLAYER_RENAMED"
  | "JERSEY_UPDATED"
  | "COACH_UPDATED"
  | "COACH_REMOVED"
  | "SUBSTITUTION"
  | "SCORE_ADDED"
  | "FOUL_ADDED"
  | "PERIOD_ADVANCED"
  | "MATCH_STARTED"
  | "MATCH_PAUSED"
  | "MATCH_ENDED"
  | "MATCH_RESET";

export type HistoryEntry = {
  id: string;
  type: HistoryActionType;
  message: string;
  timestamp: number;
};

export type PeriodScores = {
  home: number[];
  away: number[];
};

export type TeamPeriodFouls = Record<TeamId, number>;

export type GameState = {
  teams: Record<TeamId, Team>;
  match: {
    status: MatchStatus;
    currentPeriod: number;
    timeRemainingSeconds: number;
  };
  periodScores: PeriodScores;
  teamPeriodFouls: TeamPeriodFouls;
  actionLog: HistoryEntry[];
  undoStack: GameSnapshot[];
  redoStack: GameSnapshot[];
};

export type PersistedGameState = Omit<GameState, "undoStack" | "redoStack">;

export type GameSnapshot = Omit<GameState, "undoStack" | "redoStack">;

export const PERIOD_COUNT = 4;
export const PERIOD_DURATION_SECONDS = 10 * 60;

export const INITIAL_TEAM_NAMES: Record<TeamId, string> = {
  home: "Ceará",
  away: "Fortaleza",
};

export const INITIAL_COACH_NAMES: Record<TeamId, string> = {
  home: "Mozart",
  away: "Thiago Carpini",
};
