"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerSortKey, TeamId } from "@/types/game";
import { MAX_ON_COURT, MIN_PLAYERS_TO_START } from "@/types/game";
import { useGame } from "@/context/GameContext";
import {
  countOnCourt,
  getTeamScore,
  needsSubstitution,
  sortPlayers,
} from "@/utils/gameHelpers";
import { getTeamBadgeType } from "@/utils/teamBadge";
import { AddPlayerForm } from "./AddPlayerForm";
import { PlayerRow } from "./PlayerRow";
import { TeamBadge } from "./TeamBadge";

const SORT_OPTIONS: { key: PlayerSortKey; label: string }[] = [
  { key: "score", label: "Pontos" },
  { key: "name", label: "Nome" },
  { key: "jersey", label: "Camisa" },
  { key: "fouls", label: "Faltas" },
];

type Props = {
  teamId: TeamId;
};

export function TeamPanel({ teamId }: Props) {
  const { state, setTeamName, setCoachName, removeCoach } = useGame();
  const team = state.teams[teamId];
  const [editingName, setEditingName] = useState(false);
  const [editingCoach, setEditingCoach] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState(team.name);
  const [coachInput, setCoachInput] = useState(team.coachName ?? "");
  const [sortKey, setSortKey] = useState<PlayerSortKey>("score");
  const totalScore = getTeamScore(team);
  const displayName = editingName ? teamNameInput : team.name;
  const badgeType = getTeamBadgeType(displayName);
  const periodFouls = state.teamPeriodFouls[teamId];
  const rosterCount = team.players.length;
  const onCourtCount = countOnCourt(team);
  const subNeeded = needsSubstitution(team);

  const { courtPlayers, benchPlayers } = useMemo(() => {
    const sorted = sortPlayers(team.players, sortKey);
    return {
      courtPlayers: sorted.filter((p) => p.onCourt),
      benchPlayers: sorted.filter((p) => !p.onCourt),
    };
  }, [team.players, sortKey]);

  useEffect(() => {
    if (!editingName) setTeamNameInput(team.name);
  }, [team.name, editingName]);

  useEffect(() => {
    if (!editingCoach) setCoachInput(team.coachName ?? "");
  }, [team.coachName, editingCoach]);

  const saveTeamName = () => {
    setTeamName(teamId, teamNameInput);
    setEditingName(false);
  };

  const saveCoach = () => {
    if (coachInput.trim()) {
      setCoachName(teamId, coachInput);
    }
    setEditingCoach(false);
  };

  return (
    <section className={`panel team-panel team-panel--${teamId}`}>
      <header className="team-panel__header">
        <TeamBadge type={badgeType} teamId={teamId} className="team-panel__badge" />
        <div className="team-panel__identity">
          {editingName ? (
            <div className="input-row team-panel__name-edit">
              <input
                type="text"
                className="input"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTeamName();
                  if (e.key === "Escape") {
                    setTeamNameInput(team.name);
                    setEditingName(false);
                  }
                }}
              />
              <button type="button" className="btn btn--primary btn--sm" onClick={saveTeamName}>
                OK
              </button>
            </div>
          ) : (
            <h2 className="team-panel__name">{team.name}</h2>
          )}
          <p className="team-panel__meta">
            Faltas do período: <strong>{periodFouls}</strong>
            {" · "}
            Elenco: {rosterCount}
            {rosterCount < MIN_PLAYERS_TO_START && (
              <span className="team-panel__warn">
                {" "}
                (mín. {MIN_PLAYERS_TO_START} para iniciar)
              </span>
            )}
          </p>
          <div className="team-panel__coach">
            {editingCoach ? (
              <div className="input-row team-panel__coach-edit">
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do técnico"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCoach();
                    if (e.key === "Escape") {
                      setCoachInput(team.coachName ?? "");
                      setEditingCoach(false);
                    }
                  }}
                />
                <button type="button" className="btn btn--primary btn--sm" onClick={saveCoach}>
                  OK
                </button>
              </div>
            ) : (
              <p className="team-panel__coach-line">
                <span className="team-panel__coach-label">Técnico:</span>{" "}
                {team.coachName ? (
                  <strong>{team.coachName}</strong>
                ) : (
                  <span className="team-panel__coach-empty">Sem técnico</span>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--xs team-panel__coach-btn"
                  onClick={() => {
                    setCoachInput(team.coachName ?? "");
                    setEditingCoach(true);
                  }}
                >
                  {team.coachName ? "Editar" : "Adicionar"}
                </button>
                {team.coachName && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs team-panel__coach-btn"
                    onClick={() => removeCoach(teamId)}
                  >
                    Remover
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="team-panel__header-actions">
          <span className="team-panel__score">{totalScore}</span>
          {!editingName && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setTeamNameInput(team.name);
                setEditingName(true);
              }}
            >
              Editar
            </button>
          )}
        </div>
      </header>

      <div className="team-panel__body">
        <AddPlayerForm teamId={teamId} />

        <div className="team-panel__sort" role="group" aria-label="Ordenar jogadores">
          <span className="team-panel__sort-label">Ordenar:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn btn--ghost btn--xs team-panel__sort-btn ${sortKey === opt.key ? "team-panel__sort-btn--active" : ""}`}
              onClick={() => setSortKey(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {subNeeded && rosterCount >= MIN_PLAYERS_TO_START && (
          <p className="team-panel__sub-alert" role="status">
            Quadra incompleta ({onCourtCount}/{MAX_ON_COURT}). Faça uma substituição pelo banco.
          </p>
        )}

        <h3 className="player-list__heading">Em quadra ({courtPlayers.length}/{MAX_ON_COURT})</h3>
        <ul className="player-list player-list--court">
          {courtPlayers.length === 0 ? (
            <li className="player-list__empty">Nenhum jogador em quadra</li>
          ) : (
            courtPlayers.map((player, index) => (
              <PlayerRow
                key={player.id}
                teamId={teamId}
                player={player}
                courtPlayers={courtPlayers}
                variant="court"
                style={{ animationDelay: `${index * 0.04}s` }}
              />
            ))
          )}
        </ul>

        <h3 className="player-list__heading">Banco ({benchPlayers.length})</h3>
        <ul className="player-list player-list--bench">
          {benchPlayers.length === 0 ? (
            <li className="player-list__empty">Nenhum jogador no banco</li>
          ) : (
            benchPlayers.map((player, index) => (
              <PlayerRow
                key={player.id}
                teamId={teamId}
                player={player}
                courtPlayers={courtPlayers}
                variant="bench"
                style={{ animationDelay: `${index * 0.04}s` }}
              />
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
