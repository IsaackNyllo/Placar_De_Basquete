"use client";

import { FormEvent, useState } from "react";
import type { TeamId } from "@/types/game";
import { useGame } from "@/context/GameContext";

type Props = {
  teamId: TeamId;
};

export function AddPlayerForm({ teamId }: Props) {
  const { addPlayer } = useGame();
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    if (error) setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedJersey = jersey.trim();
    let jerseyNumber: number | undefined;

    if (trimmedJersey !== "") {
      const parsed = Number(trimmedJersey);
      if (!Number.isInteger(parsed)) {
        setError("Número da camisa inválido.");
        return;
      }
      jerseyNumber = parsed;
    }

    const result = addPlayer(teamId, name, jerseyNumber);
    if (result) {
      setError(result);
      return;
    }
    setName("");
    setJersey("");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="add-player-form">
      <div className="input-row">
        <input
          type="text"
          className={`input ${error ? "input--error" : ""}`}
          placeholder="Nome do jogador"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError();
          }}
          maxLength={40}
        />
        <input
          type="number"
          className={`input input--jersey ${error ? "input--error" : ""}`}
          placeholder="Nº"
          value={jersey}
          onChange={(e) => {
            setJersey(e.target.value);
            clearError();
          }}
          min={0}
          max={99}
          inputMode="numeric"
          aria-label="Número da camisa (opcional)"
          title="Camisa (opcional — vazio gera número aleatório)"
        />
        <button type="submit" className="btn btn--primary">
          +
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </form>
  );
}
