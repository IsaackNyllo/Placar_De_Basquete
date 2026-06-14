"use client";

import { useEffect, useState } from "react";
import { useMatchTimer } from "@/hooks/useMatchTimer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MatchControls } from "./MatchControls";
import { TeamPanel } from "./TeamPanel";
import { HistoryPanel } from "./HistoryPanel";
import { StatsPanel } from "./StatsPanel";

export function Scoreboard() {
  useMatchTimer();

  const isCompact = useMediaQuery("(max-width: 767px)");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    if (isCompact) {
      setHistoryOpen(false);
      setStatsOpen(false);
    } else {
      setHistoryOpen(true);
      setStatsOpen(true);
    }
  }, [isCompact]);

  const showToggleBar = !historyOpen || !statsOpen;

  return (
    <main className="scoreboard">
      <MatchControls />

      <div className="scoreboard__teams scoreboard__teams--primary">
        <TeamPanel teamId="home" />
        <div className="scoreboard__vs" aria-hidden="true">
          <span className="scoreboard__vs-badge">VS</span>
        </div>
        <TeamPanel teamId="away" />
      </div>

      {showToggleBar && (
        <nav className="scoreboard__toggle-bar" aria-label="Painéis secundários">
          {!historyOpen && (
            <button
              type="button"
              className="btn btn--ghost scoreboard__toggle-btn"
              onClick={() => setHistoryOpen(true)}
            >
              Histórico
            </button>
          )}
          {!statsOpen && (
            <button
              type="button"
              className="btn btn--ghost scoreboard__toggle-btn"
              onClick={() => setStatsOpen(true)}
            >
              Estatísticas
            </button>
          )}
        </nav>
      )}

      <div
        className={`scoreboard__side-panels ${isCompact ? "scoreboard__side-panels--compact" : ""}`}
      >
        {historyOpen && (
          <HistoryPanel onClose={() => setHistoryOpen(false)} />
        )}
        {statsOpen && (
          <StatsPanel onClose={() => setStatsOpen(false)} />
        )}
      </div>
    </main>
  );
}
