"use client";

import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
      title={theme === "light" ? "Tema escuro" : "Tema claro"}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className={`theme-toggle__thumb theme-toggle__thumb--${theme}`} />
      </span>
      <span className="theme-toggle__label">
        {theme === "light" ? "Claro" : "Escuro"}
      </span>
    </button>
  );
}
