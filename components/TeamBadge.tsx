import Image from "next/image";
import type { TeamId } from "@/types/game";
import type { BadgeType } from "@/utils/teamBadge";
import { TEAM_LOGO_ALT, TEAM_LOGO_SRC } from "@/utils/teamBadge";

type Props = {
  type: BadgeType;
  teamId: TeamId;
  className?: string;
};

const SHIELD_CLIP =
  "polygon(50% 0%, 94% 14%, 100% 52%, 50% 100%, 0% 52%, 6% 14%)";

export function TeamBadge({ type, teamId, className = "" }: Props) {
  if (type === "generic") {
    return (
      <span
        className={`team-badge team-badge--generic team-badge--${teamId} ${className}`.trim()}
        role="img"
        aria-label="Time personalizado"
      >
        <GenericShield teamId={teamId} />
      </span>
    );
  }

  return (
    <span
      className={`team-badge team-badge--${type} team-badge--${teamId} ${className}`.trim()}
    >
      <span className="team-badge__frame" style={{ clipPath: SHIELD_CLIP }}>
        <Image
          src={TEAM_LOGO_SRC[type]}
          alt={TEAM_LOGO_ALT[type]}
          width={56}
          height={64}
          className="team-badge__img"
          priority
        />
      </span>
    </span>
  );
}

function GenericShield({ teamId }: { teamId: TeamId }) {
  const isHome = teamId === "home";

  return (
    <svg
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="team-badge__svg"
      aria-hidden="true"
    >
      <path
        d="M32 4 L56 16 L60 42 L32 68 L4 42 L8 16 Z"
        fill={isHome ? "var(--badge-generic-fill-home)" : "var(--badge-generic-fill-away)"}
        stroke="var(--badge-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 36 H50 M32 18 V54"
        stroke="var(--badge-stroke)"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M32 18 C40 26 40 46 32 54 C24 46 24 26 32 18"
        stroke="var(--badge-stroke)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {isHome ? (
        <circle cx="32" cy="36" r="3" fill="var(--badge-stroke)" opacity="0.9" />
      ) : (
        <>
          <path d="M26 32 L38 32 L38 40 L26 40 Z" stroke="var(--badge-stroke)" strokeWidth="1.5" fill="none" />
        </>
      )}
    </svg>
  );
}
