import type {
  GameSnapshot,
  GameState,
  HistoryEntry,
  TeamId,
} from "@/types/game";
import {
  MAX_ON_COURT,
  MAX_PLAYER_FOULS,
  PERIOD_COUNT,
  PERIOD_DURATION_SECONDS,
} from "@/types/game";
import {
  canStartMatch,
  canSubstitute,
  countOnCourt,
  createId,
  createInitialSnapshot,
  createInitialTeamPeriodFouls,
  generateJerseyNumber,
  isMatchActiveForPlay,
  isPlayerExpelled,
  snapshotFromState,
} from "@/utils/gameHelpers";
import {
  normalizeName,
  validateJerseyNumber,
  validatePlayerName,
} from "@/utils/validation";

function pushHistory(
  log: HistoryEntry[],
  type: HistoryEntry["type"],
  message: string
): HistoryEntry[] {
  return [
    {
      id: createId(),
      type,
      message,
      timestamp: Date.now(),
    },
    ...log,
  ];
}

function withUndo(
  state: GameState,
  nextSnapshot: GameSnapshot,
  skipUndo = false
): GameState {
  if (skipUndo) {
    return { ...state, ...nextSnapshot, undoStack: state.undoStack, redoStack: [] };
  }
  const current = snapshotFromState(state);
  return {
    ...state,
    ...nextSnapshot,
    undoStack: [...state.undoStack, current],
    redoStack: [],
  };
}

function applySnapshot(state: GameState, snapshot: GameSnapshot): GameState {
  return {
    ...state,
    teams: snapshot.teams,
    match: snapshot.match,
    periodScores: snapshot.periodScores,
    teamPeriodFouls: snapshot.teamPeriodFouls,
    actionLog: snapshot.actionLog,
  };
}

function isMatchInProgress(status: GameState["match"]["status"]): boolean {
  return status === "running" || status === "paused";
}

export type GameAction =
  | { type: "HYDRATE"; payload: GameSnapshot }
  | { type: "SET_TEAM_NAME"; teamId: TeamId; name: string }
  | { type: "ADD_PLAYER"; teamId: TeamId; name: string; jerseyNumber?: number }
  | { type: "REMOVE_PLAYER"; teamId: TeamId; playerId: string }
  | { type: "RENAME_PLAYER"; teamId: TeamId; playerId: string; name: string }
  | { type: "SET_JERSEY"; teamId: TeamId; playerId: string; jerseyNumber: number }
  | { type: "SET_COACH"; teamId: TeamId; name: string }
  | { type: "REMOVE_COACH"; teamId: TeamId }
  | {
      type: "SUBSTITUTE";
      teamId: TeamId;
      playerOutId: string;
      playerInId: string;
    }
  | { type: "ADD_SCORE"; teamId: TeamId; playerId: string; points: 1 | 2 | 3 }
  | { type: "ADD_FOUL"; teamId: TeamId; playerId: string }
  | { type: "START_MATCH" }
  | { type: "PAUSE_MATCH" }
  | { type: "ADVANCE_PERIOD" }
  | { type: "END_MATCH" }
  | { type: "TICK" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

export function createInitialState(): GameState {
  const snapshot = createInitialSnapshot();
  return {
    ...snapshot,
    undoStack: [],
    redoStack: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "HYDRATE": {
      return {
        ...createInitialState(),
        ...action.payload,
        teamPeriodFouls: action.payload.teamPeriodFouls ?? createInitialTeamPeriodFouls(),
        undoStack: [],
        redoStack: [],
      };
    }

    case "SET_TEAM_NAME": {
      const trimmed = normalizeName(action.name);
      if (!trimmed || trimmed === state.teams[action.teamId].name) {
        return state;
      }
      const teams = {
        ...state.teams,
        [action.teamId]: { ...state.teams[action.teamId], name: trimmed },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "TEAM_RENAMED",
        `Equipe renomeada para "${trimmed}" (${action.teamId === "home" ? "Casa" : "Visitante"})`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "ADD_PLAYER": {
      const team = state.teams[action.teamId];
      const error = validatePlayerName(team, action.name);
      if (error) return state;

      const onCourt = countOnCourt(team) < MAX_ON_COURT;
      const jerseyNumber =
        action.jerseyNumber !== undefined
          ? action.jerseyNumber
          : generateJerseyNumber(team);
      const player = {
        id: createId(),
        name: normalizeName(action.name),
        jerseyNumber,
        onCourt,
        score: 0,
        baskets1: 0,
        baskets2: 0,
        baskets3: 0,
        fouls: 0,
      };
      const players = [...team.players, player];
      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };
      const courtLabel = onCourt ? "em quadra" : "no banco";
      const actionLog = pushHistory(
        state.actionLog,
        "PLAYER_ADDED",
        `Jogador #${player.jerseyNumber} "${player.name}" (${courtLabel}) — ${teams[action.teamId].name}`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "REMOVE_PLAYER": {
      const team = state.teams[action.teamId];
      const removed = team.players.find((p) => p.id === action.playerId);
      if (!removed) return state;

      if (
        removed.onCourt &&
        isMatchInProgress(state.match.status) &&
        countOnCourt(team) <= MAX_ON_COURT
      ) {
        const benchAvailable = team.players.some(
          (p) => p.id !== action.playerId && !p.onCourt && !isPlayerExpelled(p)
        );
        if (countOnCourt(team) === MAX_ON_COURT && benchAvailable) {
          return state;
        }
      }

      const players = team.players.filter((p) => p.id !== action.playerId);
      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "PLAYER_REMOVED",
        `Jogador "${removed.name}" removido de ${team.name}`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "RENAME_PLAYER": {
      const team = state.teams[action.teamId];
      const player = team.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      const error = validatePlayerName(team, action.name, action.playerId);
      if (error) return state;

      const newName = normalizeName(action.name);
      if (newName === player.name) return state;

      const players = team.players.map((p) =>
        p.id === action.playerId ? { ...p, name: newName } : p
      );
      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "PLAYER_RENAMED",
        `Jogador renomeado de "${player.name}" para "${newName}"`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "SET_JERSEY": {
      const team = state.teams[action.teamId];
      const player = team.players.find((p) => p.id === action.playerId);
      if (!player) return state;

      const error = validateJerseyNumber(team, action.jerseyNumber, action.playerId);
      if (error) return state;
      if (player.jerseyNumber === action.jerseyNumber) return state;

      const players = team.players.map((p) =>
        p.id === action.playerId ? { ...p, jerseyNumber: action.jerseyNumber } : p
      );
      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "JERSEY_UPDATED",
        `${player.name}: camisa #${player.jerseyNumber} → #${action.jerseyNumber}`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "SET_COACH": {
      const team = state.teams[action.teamId];
      const trimmed = normalizeName(action.name);
      if (!trimmed || trimmed === team.coachName) return state;

      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, coachName: trimmed },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "COACH_UPDATED",
        `Técnico de ${team.name}: "${trimmed}"`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "REMOVE_COACH": {
      const team = state.teams[action.teamId];
      if (!team.coachName) return state;

      const prev = team.coachName;
      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, coachName: null },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "COACH_REMOVED",
        `Técnico "${prev}" removido de ${team.name}`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "SUBSTITUTE": {
      if (!canSubstitute(state.match.status)) return state;

      const team = state.teams[action.teamId];
      const outPlayer = team.players.find((p) => p.id === action.playerOutId);
      const inPlayer = team.players.find((p) => p.id === action.playerInId);
      if (!outPlayer || !inPlayer) return state;
      if (!outPlayer.onCourt || inPlayer.onCourt) return state;
      if (isPlayerExpelled(inPlayer)) return state;

      const players = team.players.map((p) => {
        if (p.id === action.playerOutId) return { ...p, onCourt: false };
        if (p.id === action.playerInId) return { ...p, onCourt: true };
        return p;
      });

      if (countOnCourt({ ...team, players }) !== MAX_ON_COURT) return state;

      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };
      const actionLog = pushHistory(
        state.actionLog,
        "SUBSTITUTION",
        `Substituição em ${team.name}: #${outPlayer.jerseyNumber} ${outPlayer.name} sai · #${inPlayer.jerseyNumber} ${inPlayer.name} entra`
      );
      return withUndo(state, { ...snapshotFromState(state), teams, actionLog });
    }

    case "ADD_SCORE": {
      if (!isMatchActiveForPlay(state.match.status)) return state;

      const team = state.teams[action.teamId];
      const player = team.players.find((p) => p.id === action.playerId);
      if (!player || !player.onCourt || isPlayerExpelled(player)) return state;

      const periodIndex = state.match.currentPeriod - 1;
      const basketKey =
        action.points === 1 ? "baskets1" : action.points === 2 ? "baskets2" : "baskets3";

      const updatedPlayer = {
        ...player,
        score: player.score + action.points,
        [basketKey]: player[basketKey] + 1,
      };

      const players = team.players.map((p) =>
        p.id === action.playerId ? updatedPlayer : p
      );

      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };

      const periodScores = {
        home: [...state.periodScores.home],
        away: [...state.periodScores.away],
      };
      periodScores[action.teamId][periodIndex] += action.points;

      const actionLog = pushHistory(
        state.actionLog,
        "SCORE_ADDED",
        `#${updatedPlayer.jerseyNumber} ${updatedPlayer.name} (+${action.points}) — ${teams[action.teamId].name}, ${state.match.currentPeriod}º período`
      );

      return withUndo(state, {
        ...snapshotFromState(state),
        teams,
        periodScores,
        actionLog,
      });
    }

    case "ADD_FOUL": {
      if (!isMatchActiveForPlay(state.match.status)) return state;

      const team = state.teams[action.teamId];
      const player = team.players.find((p) => p.id === action.playerId);
      if (!player || !player.onCourt || isPlayerExpelled(player)) return state;

      const newFouls = Math.min(player.fouls + 1, MAX_PLAYER_FOULS);
      const expelled = newFouls >= MAX_PLAYER_FOULS;
      const updatedPlayer = {
        ...player,
        fouls: newFouls,
        onCourt: expelled ? false : player.onCourt,
      };

      const players = team.players.map((p) =>
        p.id === action.playerId ? updatedPlayer : p
      );

      const teams = {
        ...state.teams,
        [action.teamId]: { ...team, players },
      };

      const teamPeriodFouls = {
        ...state.teamPeriodFouls,
        [action.teamId]: state.teamPeriodFouls[action.teamId] + 1,
      };

      const expelledNote = expelled ? " — EXPULSO (banco)" : "";
      const actionLog = pushHistory(
        state.actionLog,
        "FOUL_ADDED",
        `Falta #${updatedPlayer.jerseyNumber} ${updatedPlayer.name} (${newFouls}/${MAX_PLAYER_FOULS}) — ${team.name}${expelledNote}`
      );

      return withUndo(state, {
        ...snapshotFromState(state),
        teams,
        teamPeriodFouls,
        actionLog,
      });
    }

    case "START_MATCH": {
      if (state.match.status === "finished") return state;
      if (!canStartMatch(state.teams)) return state;
      if (countOnCourt(state.teams.home) !== MAX_ON_COURT) return state;
      if (countOnCourt(state.teams.away) !== MAX_ON_COURT) return state;

      const match = { ...state.match, status: "running" as const };
      const actionLog = pushHistory(
        state.actionLog,
        "MATCH_STARTED",
        `Partida iniciada — ${state.match.currentPeriod}º período`
      );
      return withUndo(state, { ...snapshotFromState(state), match, actionLog });
    }

    case "PAUSE_MATCH": {
      if (state.match.status !== "running") return state;
      const match = { ...state.match, status: "paused" as const };
      const actionLog = pushHistory(
        state.actionLog,
        "MATCH_PAUSED",
        "Partida pausada"
      );
      return withUndo(state, { ...snapshotFromState(state), match, actionLog });
    }

    case "ADVANCE_PERIOD": {
      if (state.match.currentPeriod >= PERIOD_COUNT) return state;

      const nextPeriod = state.match.currentPeriod + 1;
      const match = {
        ...state.match,
        currentPeriod: nextPeriod,
        timeRemainingSeconds: PERIOD_DURATION_SECONDS,
        status:
          state.match.status === "finished"
            ? ("finished" as const)
            : state.match.status === "running"
              ? ("running" as const)
              : state.match.status,
      };
      const teamPeriodFouls = createInitialTeamPeriodFouls();
      const actionLog = pushHistory(
        state.actionLog,
        "PERIOD_ADVANCED",
        `Avanço para o ${nextPeriod}º período — faltas de equipe zeradas`
      );
      return withUndo(state, {
        ...snapshotFromState(state),
        match,
        teamPeriodFouls,
        actionLog,
      });
    }

    case "END_MATCH": {
      if (state.match.status === "finished") return state;
      const match = { ...state.match, status: "finished" as const };
      const actionLog = pushHistory(
        state.actionLog,
        "MATCH_ENDED",
        "Partida encerrada"
      );
      return withUndo(state, { ...snapshotFromState(state), match, actionLog });
    }

    case "TICK": {
      if (state.match.status !== "running") return state;
      if (state.match.timeRemainingSeconds <= 0) {
        if (state.match.currentPeriod >= PERIOD_COUNT) {
          return {
            ...state,
            match: { ...state.match, status: "finished", timeRemainingSeconds: 0 },
          };
        }
        return {
          ...state,
          match: {
            ...state.match,
            currentPeriod: state.match.currentPeriod + 1,
            timeRemainingSeconds: PERIOD_DURATION_SECONDS,
          },
          teamPeriodFouls: createInitialTeamPeriodFouls(),
        };
      }
      return {
        ...state,
        match: {
          ...state.match,
          timeRemainingSeconds: state.match.timeRemainingSeconds - 1,
        },
      };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      const current = snapshotFromState(state);
      return {
        ...applySnapshot(state, previous),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, current],
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const current = snapshotFromState(state);
      return {
        ...applySnapshot(state, next),
        undoStack: [...state.undoStack, current],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    case "RESET": {
      return {
        ...createInitialSnapshot(),
        undoStack: [],
        redoStack: [],
      };
    }

    default:
      return state;
  }
}
