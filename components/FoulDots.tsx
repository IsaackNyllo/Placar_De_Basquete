import { MAX_PLAYER_FOULS } from "@/types/game";

type Props = {
  fouls: number;
  className?: string;
};

export function FoulDots({ fouls, className = "" }: Props) {
  return (
    <span
      className={`foul-dots ${className}`.trim()}
      role="img"
      aria-label={`${fouls} de ${MAX_PLAYER_FOULS} faltas`}
    >
      {Array.from({ length: MAX_PLAYER_FOULS }, (_, i) => (
        <span
          key={i}
          className={`foul-dot ${i < fouls ? "foul-dot--filled" : ""}`.trim()}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
