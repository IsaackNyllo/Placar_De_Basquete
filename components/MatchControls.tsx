"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { formatTime } from "@/utils/gameHelpers";
import { MAX_ON_COURT, MIN_PLAYERS_TO_START, PERIOD_COUNT } from "@/types/game";
import { countOnCourt } from "@/utils/gameHelpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ThemeToggle } from "./ThemeToggle";
import { HelpModal } from "./HelpModal";

export function MatchControls() {
  const {
    state,
    startMatch,
    pauseMatch,
    advancePeriod,
    endMatch,
    resetMatch,
    canStartMatch,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useGame();

  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const isCompact = useMediaQuery("(max-width: 639px)");

  const { match, teams, teamPeriodFouls } = state;
  const isRunning = match.status === "running";
  const isFinished = match.status === "finished";
  const canStartStatus = match.status === "idle" || match.status === "paused";
  const courtReady =
    countOnCourt(teams.home) === MAX_ON_COURT &&
    countOnCourt(teams.away) === MAX_ON_COURT;
  const canStartEnabled = canStartStatus && canStartMatch && courtReady && !isFinished;
  const startDisabledReason = !canStartMatch
    ? `Cadastre pelo menos ${MIN_PLAYERS_TO_START} jogadores em cada time`
    : !courtReady
      ? `Cada time precisa de ${MAX_ON_COURT} jogadores em quadra`
      : "";

  const handleReset = () => {
    if (
      window.confirm(
        "Iniciar nova partida? Todos os dados serão apagados do navegador."
      )
    ) {
      resetMatch();
      setMenuOpen(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const secondaryActions = (
    <>
      <button
        type="button"
        className="btn btn--accent"
        onClick={() => {
          advancePeriod();
          closeMenu();
        }}
        disabled={isFinished || match.currentPeriod >= PERIOD_COUNT}
      >
        Avançar período
      </button>
      <button
        type="button"
        className="btn btn--danger"
        onClick={() => {
          endMatch();
          closeMenu();
        }}
        disabled={isFinished}
      >
        Encerrar
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          undo();
          closeMenu();
        }}
        disabled={!canUndo}
      >
        Desfazer
      </button>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          redo();
          closeMenu();
        }}
        disabled={!canRedo}
      >
        Refazer
      </button>
      <button type="button" className="btn btn--ghost" onClick={handleReset}>
        Nova partida
      </button>
    </>
  );

  return (
    <section className="panel match-controls scoreboard__hero">
      <div className="panel__body match-controls__body">
        <div className="match-controls__top">
          <div className="match-controls__head">
            <div className="match-controls__brand-block">
              <div className="match-controls__theme">
                <ThemeToggle />
              </div>
              <p className="match-controls__kicker">Ginásio · Basquete</p>
              <h1 className="match-controls__brand">Placar de Basquete</h1>
              <p
                className={`match-controls__meta ${isFinished ? "match-controls__meta--finished" : ""}`}
              >
                Período {match.currentPeriod} / {PERIOD_COUNT}
                {isFinished && " · Encerrada"}
              </p>
            </div>
          </div>
          <div className="match-controls__metrics">
            <div
              className={`timer-display ${isRunning ? "timer-display--running" : ""}`}
            >
              <span className="timer-display__label">Tempo restante</span>
              <span className="timer-display__value">
                {formatTime(match.timeRemainingSeconds)}
              </span>
            </div>
            <div className="match-controls__team-fouls" aria-label="Faltas da equipe no período">
              <span className="match-controls__team-fouls-title">Faltas da equipe</span>
              <span className="match-controls__team-fouls-row">
                <span>
                  {teams.home.name}: <strong>{teamPeriodFouls.home}</strong>
                </span>
                <span className="match-controls__team-fouls-sep">·</span>
                <span>
                  {teams.away.name}: <strong>{teamPeriodFouls.away}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        {isCompact ? (
          <>
            <div className="match-controls__mobile-bar">
              <span
                className="disabled-action-tooltip"
                title={!canStartEnabled ? startDisabledReason : undefined}
              >
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={startMatch}
                  disabled={!canStartEnabled}
                >
                  Iniciar
                </button>
              </span>
              <button
                type="button"
                className="btn btn--warn"
                onClick={pauseMatch}
                disabled={!isRunning}
              >
                Pausar
              </button>
              <button
                type="button"
                className={`btn btn--menu ${menuOpen ? "btn--menu-open" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="match-actions-menu"
                aria-label={menuOpen ? "Fechar menu" : "Mais ações da partida"}
              >
                <span className="btn--menu-icon" aria-hidden="true" />
                <span className="btn--menu-label">Menu</span>
              </button>
            </div>
            <div
              id="match-actions-menu"
              className={`match-controls__drawer ${menuOpen ? "match-controls__drawer--open" : ""}`}
              aria-hidden={!menuOpen}
            >
              {secondaryActions}
            </div>
          </>
        ) : (
          <div className="match-controls__actions">
            <span
              className="disabled-action-tooltip"
              title={!canStartEnabled ? startDisabledReason : undefined}
            >
              <button
                type="button"
                className="btn btn--primary"
                onClick={startMatch}
                disabled={!canStartEnabled}
              >
                Iniciar
              </button>
            </span>
            <button
              type="button"
              className="btn btn--warn"
              onClick={pauseMatch}
              disabled={!isRunning}
            >
              Pausar
            </button>
            {secondaryActions}
          </div>
        )}

        {match.status === "idle" && (
          <p className="match-controls__hint">
            Cadastre {MIN_PLAYERS_TO_START}+ jogadores por time, complete a quadra (
            {MAX_ON_COURT} em cada lado) e inicie para pontuar com o cronômetro rodando.
          </p>
        )}

        <button
          type="button"
          className="help-btn help-btn--card"
          onClick={() => setHelpOpen(true)}
          aria-label="Ajuda e regras do placar"
          data-tooltip="Ajuda"
        >
          ?
        </button>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </section>
  );
}
