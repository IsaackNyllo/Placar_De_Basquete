"use client";

import { useState } from "react";
import { formatJerseyNumber } from "@/utils/gameHelpers";
import { JerseyIcon } from "./JerseyIcon";

type Props = {
  number: number;
  editable?: boolean;
  onSave?: (number: number) => string | null;
  className?: string;
  /** Modo controlado: input integrado ao formulário de edição do jogador (sem botão OK). */
  embedded?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
};

export function JerseyBadge({
  number,
  editable = false,
  onSave,
  className = "",
  embedded = false,
  inputValue,
  onInputChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(number));
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    if (!editable || !onSave) return;
    setInput(String(number));
    setError(null);
    setEditing(true);
  };

  const save = () => {
    const parsed = parseInt(input, 10);
    if (Number.isNaN(parsed)) {
      setError("Número inválido");
      return;
    }
    const result = onSave?.(parsed);
    if (result) {
      setError(result);
      return;
    }
    setEditing(false);
    setError(null);
  };

  if (embedded) {
    return (
      <span
        className={`jersey-badge jersey-badge--embedded ${className}`.trim()}
        aria-label="Número da camisa"
      >
        <JerseyIcon size="md" className="jersey-badge__icon" />
        <input
          type="number"
          min={0}
          max={99}
          className="jersey-badge__input jersey-badge__input--overlay"
          value={inputValue ?? String(number)}
          onChange={(e) => onInputChange?.(e.target.value)}
          aria-label="Número da camisa"
        />
      </span>
    );
  }

  if (editing) {
    return (
      <span className={`jersey-badge jersey-badge--edit ${className}`.trim()}>
        <JerseyIcon size="md" className="jersey-badge__icon" />
        <input
          type="number"
          min={0}
          max={99}
          className={`jersey-badge__input jersey-badge__input--overlay ${error ? "input--error" : ""}`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setEditing(false);
              setError(null);
            }
          }}
          aria-label="Número da camisa"
        />
        <button type="button" className="btn btn--primary btn--xs jersey-badge__ok" onClick={save}>
          OK
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`jersey-badge ${editable ? "jersey-badge--clickable" : ""} ${className}`.trim()}
      onClick={startEdit}
      disabled={!editable}
      title={editable ? "Editar número da camisa" : undefined}
      aria-label={`Camisa ${formatJerseyNumber(number)}`}
    >
      <JerseyIcon size="md" className="jersey-badge__icon" />
      <span className="jersey-badge__number">{formatJerseyNumber(number)}</span>
    </button>
  );
}
