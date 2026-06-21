import { getPopulation, type PopTable } from "./population";

export type AgeGroup = "all" | "60plus" | "80plus";

export const AGE_GROUPS: AgeGroup[] = ["all", "60plus", "80plus"];

export const AGE_LABELS: Record<AgeGroup, string> = {
  all: "All ages",
  "60plus": "60+ years old",
  "80plus": "80+ years old",
};

const AGE_60_PLUS = new Set(["60 - 69", "70 - 79", "80+"]);
const AGE_80_PLUS = new Set(["80+"]);

export function matchesAgeGroup(altersgruppe: string, group: AgeGroup): boolean {
  if (group === "all") return true;
  if (group === "60plus") return AGE_60_PLUS.has(altersgruppe);
  return AGE_80_PLUS.has(altersgruppe);
}

export function agePopulation(
  state: string,
  group: AgeGroup,
  agePop: Map<string, number>,
  population: PopTable,
  date: Date
): number {
  if (group === "all") return getPopulation(population, state, date);
  if (state === "ALL") {
    let sum = 0;
    for (const p of agePop.values()) sum += p;
    return sum;
  }
  return agePop.get(state) ?? 0;
}

export function toAgePpm(
  cases: number,
  state: string,
  date: Date,
  group: AgeGroup,
  agePop: Map<string, number>,
  population: PopTable
): number {
  const pop = agePopulation(state, group, agePop, population, date);
  if (!pop) return 0;
  return (cases / pop) * 1_000_000;
}
