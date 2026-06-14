"use client";

import { useGame } from "@/context/GameContext";

type Props = {
  onClose?: () => void;
};

export function HistoryPanel({ onClose }: Props) {
  const { state } = useGame();

  return (
    <section className="panel history-panel">
      <header className="panel__header">
        <h2 className="panel__title">Histórico</h2>
        {onClose && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Ocultar histórico"
          >
            Ocultar
          </button>
        )}
      </header>
      <div className="panel__body panel__body--flush">
        <ul className="history-list">
          {state.actionLog.length === 0 ? (
            <li className="history-list__empty">Nenhuma ação registrada</li>
          ) : (
            state.actionLog.map((entry, i) => (
              <li
                key={entry.id}
                className="history-list__item"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
              >
                <span className="history-list__time">
                  {new Date(entry.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                {entry.message}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
