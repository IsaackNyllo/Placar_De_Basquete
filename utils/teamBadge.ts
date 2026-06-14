import { normalizeName } from "@/utils/validation";

export type BadgeType = "ceara" | "fortaleza" | "generic";

export const TEAM_LOGO_SRC = {
  ceara: "/logos/ceara.png",
  fortaleza: "/logos/fortaleza.png",
} as const;

export const TEAM_LOGO_ALT: Record<"ceara" | "fortaleza", string> = {
  ceara: "Escudo do Ceará Sporting Club",
  fortaleza: "Escudo do Fortaleza Esporte Clube",
};

const CEARA_NAMES = ["ceará", "ceara"];
const FORTALEZA_NAMES = ["fortaleza"];

function foldName(name: string): string {
  return normalizeName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getTeamBadgeType(teamName: string): BadgeType {
  const folded = foldName(teamName);

  if (CEARA_NAMES.some((n) => foldName(n) === folded)) {
    return "ceara";
  }
  if (FORTALEZA_NAMES.some((n) => foldName(n) === folded)) {
    return "fortaleza";
  }
  return "generic";
}
