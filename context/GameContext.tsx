"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { gameReducer, createInitialState, type GameAction } from "@/reducers/gameReducer";
import type { GameState, TeamId } from "@/types/game";
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
  toPersistedState,
} from "@/utils/storage";
import {
  canStartMatch,
  canSubstitute,
  createInitialSnapshot,
  isMatchActiveForPlay,
} from "@/utils/gameHelpers";
import { validateJerseyNumber, validatePlayerName } from "@/utils/validation";

type GameContextValue = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  canScore: boolean;
  canStartMatch: boolean;
  canSubstitute: boolean;
  canUndo: boolean;
  canRedo: boolean;
  resetMatch: () => void;
  setTeamName: (teamId: TeamId, name: string) => void;
  addPlayer: (teamId: TeamId, name: string, jerseyNumber?: number) => string | null;
  removePlayer: (teamId: TeamId, playerId: string) => void;
  renamePlayer: (teamId: TeamId, playerId: string, name: string) => string | null;
  setJerseyNumber: (
    teamId: TeamId,
    playerId: string,
    jerseyNumber: number
  ) => string | null;
  setCoachName: (teamId: TeamId, name: string) => void;
  removeCoach: (teamId: TeamId) => void;
  substitutePlayers: (
    teamId: TeamId,
    playerOutId: string,
    playerInId: string
  ) => void;
  addScore: (teamId: TeamId, playerId: string, points: 1 | 2 | 3) => void;
  addFoul: (teamId: TeamId, playerId: string) => void;
  startMatch: () => void;
  pauseMatch: () => void;
  advancePeriod: () => void;
  endMatch: () => void;
  undo: () => void;
  redo: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved) {
      dispatch({ type: "HYDRATE", payload: saved });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePersistedState(toPersistedState(state));
  }, [state, hydrated]);

  const canScore = isMatchActiveForPlay(state.match.status);
  const matchCanStart = canStartMatch(state.teams);
  const substitutionAllowed = canSubstitute(state.match.status);
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const addPlayer = useCallback(
    (teamId: TeamId, name: string, jerseyNumber?: number): string | null => {
      const team = state.teams[teamId];
      const nameError = validatePlayerName(team, name);
      if (nameError) return nameError;
      if (jerseyNumber !== undefined) {
        const jerseyError = validateJerseyNumber(team, jerseyNumber);
        if (jerseyError) return jerseyError;
      }
      dispatch({ type: "ADD_PLAYER", teamId, name, jerseyNumber });
      return null;
    },
    [state.teams]
  );

  const renamePlayer = useCallback(
    (teamId: TeamId, playerId: string, name: string): string | null => {
      const error = validatePlayerName(state.teams[teamId], name, playerId);
      if (error) return error;
      dispatch({ type: "RENAME_PLAYER", teamId, playerId, name });
      return null;
    },
    [state.teams]
  );

  const setJerseyNumber = useCallback(
    (teamId: TeamId, playerId: string, jerseyNumber: number): string | null => {
      const error = validateJerseyNumber(state.teams[teamId], jerseyNumber, playerId);
      if (error) return error;
      dispatch({ type: "SET_JERSEY", teamId, playerId, jerseyNumber });
      return null;
    },
    [state.teams]
  );

  const resetMatch = useCallback(() => {
    dispatch({ type: "RESET" });
    clearPersistedState();
    savePersistedState(createInitialSnapshot());
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      canScore,
      canStartMatch: matchCanStart,
      canSubstitute: substitutionAllowed,
      canUndo,
      canRedo,
      resetMatch,
      setTeamName: (teamId, name) => dispatch({ type: "SET_TEAM_NAME", teamId, name }),
      addPlayer,
      removePlayer: (teamId, playerId) =>
        dispatch({ type: "REMOVE_PLAYER", teamId, playerId }),
      renamePlayer,
      setJerseyNumber,
      setCoachName: (teamId, name) => dispatch({ type: "SET_COACH", teamId, name }),
      removeCoach: (teamId) => dispatch({ type: "REMOVE_COACH", teamId }),
      substitutePlayers: (teamId, playerOutId, playerInId) =>
        dispatch({ type: "SUBSTITUTE", teamId, playerOutId, playerInId }),
      addScore: (teamId, playerId, points) =>
        dispatch({ type: "ADD_SCORE", teamId, playerId, points }),
      addFoul: (teamId, playerId) =>
        dispatch({ type: "ADD_FOUL", teamId, playerId }),
      startMatch: () => dispatch({ type: "START_MATCH" }),
      pauseMatch: () => dispatch({ type: "PAUSE_MATCH" }),
      advancePeriod: () => dispatch({ type: "ADVANCE_PERIOD" }),
      endMatch: () => dispatch({ type: "END_MATCH" }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
    }),
    [
      state,
      canScore,
      matchCanStart,
      substitutionAllowed,
      canUndo,
      canRedo,
      resetMatch,
      addPlayer,
      renamePlayer,
      setJerseyNumber,
    ]
  );

  if (!hydrated) {
    return (
      <div className="arena-loader" role="status" aria-label="Carregando">
        <div className="arena-loader__ring" />
      </div>
    );
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame deve ser usado dentro de GameProvider");
  }
  return ctx;
}
