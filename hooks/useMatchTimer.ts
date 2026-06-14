"use client";

import { useEffect } from "react";
import { useGame } from "@/context/GameContext";

export function useMatchTimer() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (state.match.status !== "running") return;

    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.match.status, dispatch]);
}
