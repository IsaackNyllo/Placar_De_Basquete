"use client";

import { useGame } from "@/context/GameContext";
import {
  findTopScorer,
  formatJerseyNumber,
  getTeamScore,
  getWinner,
} from "@/utils/gameHelpers";
import { PERIOD_COUNT } from "@/types/game";
import { FoulDots } from "./FoulDots";

type Props = {
  onClose?: () => void;
};

export function StatsPanel({ onClose }: Props) {
  const { state } = useGame();
  const { teams, periodScores, teamPeriodFouls, match } = state;

  const homeTotal = getTeamScore(teams.home);
  const awayTotal = getTeamScore(teams.away);
  const topScorer = findTopScorer(teams);
  const winner = match.status === "finished" ? getWinner(teams) : null;

  return (
    <section className="panel stats-panel">
      <header className="panel__header">
        <h2 className="panel__title">Estatísticas</h2>
        {onClose && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Ocultar estatísticas"
          >
            Ocultar
          </button>
        )}
      </header>
      <div className="panel__body">
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-box__label">{teams.home.name}</span>
            <span className="stat-box__value">{homeTotal}</span>
            <span className="stat-box__sub">Faltas período: {teamPeriodFouls.home}</span>
          </div>
          <div className="stat-box">
            <span className="stat-box__label">{teams.away.name}</span>
            <span className="stat-box__value">{awayTotal}</span>
            <span className="stat-box__sub">Faltas período: {teamPeriodFouls.away}</span>
          </div>
        </div>

        {topScorer && topScorer.player.score > 0 && (
          <p className="stat-highlight">
            <strong>Cestinha:</strong> #{formatJerseyNumber(topScorer.player.jerseyNumber)}{" "}
            {topScorer.player.name} · {teams[topScorer.teamId].name} ·{" "}
            {topScorer.player.score} pts
          </p>
        )}

        <h3 className="stat-section-title">Por período</h3>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{teams.home.name}</th>
                <th>{teams.away.name}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PERIOD_COUNT }, (_, i) => (
                <tr key={i}>
                  <td>{i + 1}º</td>
                  <td>{periodScores.home[i]}</td>
                  <td>{periodScores.away[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="stat-section-title">Jogadores</h3>
        <ul className="stats-players">
          {(["home", "away"] as const).map((teamId) =>
            teams[teamId].players.map((p) => (
              <li key={p.id}>
                <strong>
                  #{formatJerseyNumber(p.jerseyNumber)} {p.name}
                </strong>{" "}
                ({teams[teamId].name}) — {p.score} pts ·{" "}
                {p.onCourt ? "Em quadra" : "Banco"}
                <div className="stats-players__meta">
                  <span className="stats-players__baskets">
                    1:{p.baskets1} · 2:{p.baskets2} · 3:{p.baskets3}
                  </span>
                  <FoulDots fouls={p.fouls} className="stats-players__fouls" />
                </div>
              </li>
            ))
          )}
          {teams.home.players.length === 0 && teams.away.players.length === 0 && (
            <li>Sem jogadores</li>
          )}
        </ul>

        {winner && (
          <div className="winner-banner">
            {winner === "tie" ? (
              <>Empate final — {homeTotal} x {awayTotal}</>
            ) : (
              <>
                Vencedor: <strong>{winner.name}</strong> ({winner.score} pts)
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
