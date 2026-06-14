"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div
      className="help-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <button
        type="button"
        className="help-modal__backdrop"
        onClick={onClose}
        aria-label="Fechar ajuda"
      />
      <div className="help-modal__panel">
        <header className="help-modal__header">
          <h2 id="help-modal-title" className="help-modal__title">
            Como usar o placar
          </h2>
          <button
            type="button"
            className="help-modal__close btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            Fechar
          </button>
        </header>
        <div className="help-modal__body">
          <section>
            <h3>Iniciar partida</h3>
            <p>
              Cadastre pelo menos 5 jogadores em cada time e mantenha 5 em quadra. O técnico é
              opcional. Clique em <strong>Iniciar</strong> para o cronômetro rodar.
            </p>
          </section>
          <section>
            <h3>Pontuação</h3>
            <p>
              Use +1, +2 ou +3 nos jogadores <strong>em quadra</strong>. Só é possível pontuar com o
              cronômetro <strong>rodando</strong> (não em pausa).
            </p>
          </section>
          <section>
            <h3>Faltas individuais</h3>
            <p>
              Cada jogador tem até 5 faltas (bolinhas vermelhas). Na 5ª falta ele é{" "}
              <strong>expulso</strong> e vai ao banco — faça uma substituição para completar a
              quadra.
            </p>
          </section>
          <section>
            <h3>Faltas da equipe</h3>
            <p>
              O placar central mostra as faltas do período de cada time. Esse contador zera ao
              avançar de período.
            </p>
          </section>
          <section>
            <h3>Substituições</h3>
            <p>
              Pause o cronômetro (ou antes de iniciar) e use <strong>Entrar</strong> no banco para
              trocar jogadores. Máximo de 5 em quadra por time.
            </p>
          </section>
          <section>
            <h3>Períodos e controles</h3>
            <p>
              São 4 períodos de 10 minutos. Pause, avance período ou encerre a partida pelo menu.
              Use <strong>Desfazer</strong> e <strong>Refazer</strong> para corrigir a última ação.
              <strong> Nova partida</strong> restaura os elencos padrão de Ceará e Fortaleza.
            </p>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
