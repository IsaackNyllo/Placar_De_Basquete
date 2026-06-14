"use client";

import { useState } from "react";
import type { Player, TeamId } from "@/types/game";
import { formatJerseyNumber, isPlayerExpelled } from "@/utils/gameHelpers";

type Props = {
  teamId: TeamId;
  benchPlayer: Player;
  courtPlayers: Player[];
  onSubstitute: (playerOutId: string) => void;
  onCancel: () => void;
};

export function SubstitutionPicker({
  benchPlayer,
  courtPlayers,
  onSubstitute,
  onCancel,
}: Props) {
  const [selectedOut, setSelectedOut] = useState<string | null>(null);

  const eligibleCourt = courtPlayers.filter((p) => !isPlayerExpelled(p));

  return (
    <div className="substitution-picker" role="dialog" aria-label="Substituição">
      <p className="substitution-picker__title">
        Entrar: <strong>#{formatJerseyNumber(benchPlayer.jerseyNumber)} {benchPlayer.name}</strong>
      </p>
      <p className="substitution-picker__hint">Quem sai de quadra?</p>
      <ul className="substitution-picker__list">
        {eligibleCourt.length === 0 ? (
          <li className="substitution-picker__empty">Nenhum jogador em quadra disponível</li>
        ) : (
          eligibleCourt.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`substitution-picker__option ${selectedOut === p.id ? "substitution-picker__option--selected" : ""}`}
                onClick={() => setSelectedOut(p.id)}
              >
                #{formatJerseyNumber(p.jerseyNumber)} {p.name}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="substitution-picker__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!selectedOut}
          onClick={() => selectedOut && onSubstitute(selectedOut)}
        >
          Confirmar
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
