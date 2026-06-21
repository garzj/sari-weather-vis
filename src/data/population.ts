import { dsvFormat } from "d3";

const NAME_TO_STATE: Record<string, string> = {
  Austria: "ALL",
  Burgenland: "BGL",
  Carinthia: "KTN",
  "Lower Austria": "NÖ",
  "Upper Austria": "OÖ",
  Salzburg: "SBG",
  Styria: "ST",
  Tyrol: "T",
  Vorarlberg: "V",
  Vienna: "W",
};

export type PopTable = Map<string, Map<number, number>>;

export function parsePopulation(text: string): PopTable {
  const table: PopTable = new Map();
  const rows = dsvFormat(";").parse(text);
  if (rows.length === 0) return table;

  const headers = Object.keys(rows[0]);
  const nameKey = headers[0];

  for (const row of rows) {
    const state = NAME_TO_STATE[row[nameKey] ?? ""];
    if (!state) continue;
    const byYear = new Map<number, number>();
    for (const h of headers.slice(1)) {
      const year = Number(h.match(/(\d{4})/)?.[1]);
      if (!year) continue;
      const raw = row[h]?.replace(/\./g, "") ?? "";
      const pop = +raw;
      if (pop) byYear.set(year, pop);
    }
    table.set(state, byYear);
  }
  return table;
}

export function getPopulation(
  table: PopTable,
  state: string,
  date: Date
): number {
  const byYear = table.get(state);
  if (!byYear?.size) return 0;
  const year = date.getUTCFullYear();
  if (byYear.has(year)) return byYear.get(year)!;
  let bestYear = -Infinity;
  for (const y of byYear.keys()) {
    if (y <= year && y > bestYear) bestYear = y;
  }
  if (bestYear > -Infinity) return byYear.get(bestYear)!;
  return byYear.get(Math.min(...byYear.keys())) ?? 0;
}

export function toPpm(
  cases: number,
  state: string,
  date: Date,
  table: PopTable
): number {
  const pop = getPopulation(table, state, date);
  if (!pop) return 0;
  return (cases / pop) * 1_000_000;
}
