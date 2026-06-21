export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateInput(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export type Season = "Winter" | "Spring" | "Summer" | "Autumn";

export const SEASONS: Season[] = ["Winter", "Spring", "Summer", "Autumn"];

export function seasonOf(date: Date): Season {
  const m = date.getUTCMonth();
  if (m <= 1 || m === 11) return "Winter";
  if (m <= 4) return "Spring";
  if (m <= 7) return "Summer";
  return "Autumn";
}

export const SEASON_COLORS: Record<Season, string> = {
  Winter: "#4e79a7",
  Spring: "#59a14f",
  Summer: "#e15759",
  Autumn: "#f28e2b",
};
