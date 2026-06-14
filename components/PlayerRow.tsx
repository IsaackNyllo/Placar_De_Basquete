"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Player, TeamId } from "@/types/game";
import { useGame } from "@/context/GameContext";
import {
  canPlayerReceiveFoul,
  canPlayerScore,
  getPlayActionDisabledReason,
  getSubstitutionDisabledReason,
  isPlayerExpelled,
} from "@/utils/gameHelpers";
import { FoulDots } from "./FoulDots";
import { JerseyBadge } from "./JerseyBadge";
import { SubstitutionPicker } from "./SubstitutionPicker";

type Props = {
  teamId: TeamId;
  player: Player;
  courtPlayers: Player[];
  variant: "court" | "bench";
  style?: CSSProperties;
};

export function PlayerRow({ teamId, player, courtPlayers, variant, style }: Props) {
  const {
    state,
    canScore,
    canSubstitute,
    addScore,
    addFoul,
    removePlayer,
    renamePlayer,
    setJerseyNumber,
    substitutePlayers,
  } = useGame();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editJersey, setEditJersey] = useState(String(player.jerseyNumber));
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  const matchStatus = state.match.status;
  const expelled = isPlayerExpelled(player);
  const isCourt = variant === "court";
  const disabledReason = getPlayActionDisabledReason(player, matchStatus);
  const canAddPoints = canScore && canPlayerScore(player, matchStatus);
  const canAddFoul = canScore && canPlayerReceiveFoul(player, matchStatus);
  const subDisabledReason = getSubstitutionDisabledReason(matchStatus);
  const canEnterCourt =
    canSubstitute && courtPlayers.filter((p) => !isPlayerExpelled(p)).length > 0;

  const saveEdit = () => {
    const parsedJersey = parseInt(editJersey, 10);
    if (Number.isNaN(parsedJersey)) {
      setError("Número de camisa inválido");
      return;
    }

    const jerseyResult = setJerseyNumber(teamId, player.id, parsedJersey);
    if (jerseyResult) {
      setError(jerseyResult);
      return;
    }

    const nameResult = renamePlayer(teamId, player.id, editName);
    if (nameResult) {
      setError(nameResult);
      return;
    }

    setEditing(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditName(player.name);
    setEditJersey(String(player.jerseyNumber));
    setEditing(false);
    setError(null);
  };

  const startEdit = () => {
    setEditName(player.name);
    setEditJersey(String(player.jerseyNumber));
    setEditing(true);
    setError(null);
  };

  const handleScore = (pts: 1 | 2 | 3) => {
    addScore(teamId, player.id, pts);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 550);
  };

  const handleSubstitute = (playerOutId: string) => {
    substitutePlayers(teamId, playerOutId, player.id);
    setSubOpen(false);
  };

  return (
    <li
      className={`player-row player-row--${variant} ${flash ? "player-row--flash" : ""} ${expelled ? "player-row--expelled" : ""}`}
      style={style}
    >
      <div className="player-row__inner">
        {!editing && (
          <JerseyBadge
            number={player.jerseyNumber}
            editable
            onSave={(n) => setJerseyNumber(teamId, player.id, n)}
            className="player-row__jersey"
          />
        )}

        <div className="player-row__info">
          {editing ? (
            <>
              <div className="player-row__edit-form">
                <JerseyBadge
                  number={player.jerseyNumber}
                  embedded
                  inputValue={editJersey}
                  onInputChange={(v) => {
                    setEditJersey(v);
                    if (error) setError(null);
                  }}
                  className="player-row__jersey-edit"
                />
                <input
                  type="text"
                  className={`input player-row__name-input ${error ? "input--error" : ""}`}
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  aria-label="Nome do jogador"
                />
              </div>
              {error && <span className="field-error">{error}</span>}
              <div className="player-row__edit-actions">
                <button type="button" className="btn btn--primary btn--sm" onClick={saveEdit}>
                  Salvar
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={cancelEdit}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="player-row__meta-line">
                <span className="player-row__name-line">
                  <span className="player-row__name">{player.name}</span>
                  {expelled && <span className="player-row__expelled-tag">EXPULSO</span>}
                  {!isCourt && !expelled && (
                    <span className="player-row__bench-tag">BANCO</span>
                  )}
                </span>
                <FoulDots fouls={player.fouls} className="player-row__fouls" />
                <span className="player-row__pts">{player.score}</span>
              </div>
              <span className="player-row__stats">
                1pt {player.baskets1} · 2pt {player.baskets2} · 3pt {player.baskets3}
              </span>
            </>
          )}
        </div>

        {!editing && !subOpen && (
          <div className="player-row__actions">
            {isCourt ? (
              <>
                <DisabledActionTooltip blocked={!canAddPoints} reason={disabledReason}>
                  <div className="score-btn-group" role="group" aria-label={`Pontos de ${player.name}`}>
                    {([1, 2, 3] as const).map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        className={`score-btn score-btn--${pts}`}
                        disabled={!canAddPoints}
                        onClick={() => handleScore(pts)}
                        title={canAddPoints ? `+${pts} pontos` : undefined}
                      >
                        +{pts}
                      </button>
                    ))}
                  </div>
                </DisabledActionTooltip>
                <DisabledActionTooltip blocked={!canAddFoul} reason={disabledReason}>
                  <button
                    type="button"
                    className="btn btn--foul btn--sm"
                    disabled={!canAddFoul}
                    onClick={() => addFoul(teamId, player.id)}
                    title={canAddFoul ? "Registrar falta" : undefined}
                  >
                    + Falta
                  </button>
                </DisabledActionTooltip>
              </>
            ) : (
              !expelled && (
                <DisabledActionTooltip
                  blocked={!canEnterCourt}
                  reason={subDisabledReason || "Nenhum jogador em quadra disponível"}
                >
                  <button
                    type="button"
                    className="btn btn--accent btn--sm"
                    onClick={() => setSubOpen(true)}
                    disabled={!canEnterCourt}
                    title={canEnterCourt ? "Substituir jogador em quadra" : undefined}
                  >
                    Entrar
                  </button>
                </DisabledActionTooltip>
              )
            )}
            <button type="button" className="btn btn--ghost btn--sm" onClick={startEdit}>
              Editar
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => {
                if (window.confirm(`Remover ${player.name}?`)) {
                  removePlayer(teamId, player.id);
                }
              }}
            >
              Remover
            </button>
          </div>
        )}

        {subOpen && !isCourt && (
          <SubstitutionPicker
            teamId={teamId}
            benchPlayer={player}
            courtPlayers={courtPlayers}
            onSubstitute={handleSubstitute}
            onCancel={() => setSubOpen(false)}
          />
        )}
      </div>
    </li>
  );
}

type DisabledActionTooltipProps = {
  blocked: boolean;
  reason: string;
  children: ReactNode;
};

function DisabledActionTooltip({ blocked, reason, children }: DisabledActionTooltipProps) {
  if (!blocked || !reason) {
    return <>{children}</>;
  }
  return (
    <span className="disabled-action-tooltip" title={reason}>
      {children}
    </span>
  );
}
