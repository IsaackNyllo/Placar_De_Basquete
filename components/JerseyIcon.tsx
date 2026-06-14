type Props = {
  filled?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
};

/** Silhueta minimalista de camisa de basquete (sem mangas). */
export function JerseyIcon({ filled = false, size = "md", className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 28"
      className={`jersey-icon jersey-icon--${size} ${filled ? "jersey-icon--filled" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      <path
        className="jersey-icon__shape"
        d="M12 3.5C9.1 3.5 6.8 5 5.6 7.3L4 9.8V25h16V9.8l-1.6-2.5C17.2 5 14.9 3.5 12 3.5zm0 0c1.2 0 2.2.5 2.8 1.3M12 3.5c-1.2 0-2.2.5-2.8 1.3"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
