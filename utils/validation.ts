import type { Team } from "@/types/game";

export function normalizeName(name: string): string {
  return name.trim();
}

export function isEmptyName(name: string): boolean {
  return normalizeName(name).length === 0;
}

export function isDuplicatePlayerName(team: Team, name: string, excludeId?: string): boolean {
  const normalized = normalizeName(name).toLowerCase();
  return team.players.some(
    (p) => p.id !== excludeId && p.name.trim().toLowerCase() === normalized
  );
}

export function isDuplicateJerseyNumber(
  team: Team,
  jerseyNumber: number,
  excludeId?: string
): boolean {
  return team.players.some(
    (p) => p.id !== excludeId && p.jerseyNumber === jerseyNumber
  );
}

export function validatePlayerName(
  team: Team,
  name: string,
  excludeId?: string
): string | null {
  if (isEmptyName(name)) {
    return "O nome do jogador não pode ser vazio.";
  }
  if (isDuplicatePlayerName(team, name, excludeId)) {
    return "Já existe um jogador com este nome nesta equipe.";
  }
  return null;
}

export function validateJerseyNumber(
  team: Team,
  jerseyNumber: number,
  excludeId?: string
): string | null {
  if (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99) {
    return "Número da camisa deve ser entre 0 e 99.";
  }
  if (isDuplicateJerseyNumber(team, jerseyNumber, excludeId)) {
    return "Já existe um jogador com este número nesta equipe.";
  }
  return null;
}
