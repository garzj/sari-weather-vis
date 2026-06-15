import type { DailyRecord } from "./load";
import { METRICS, type MetricId } from "./metrics";

// merge all states into one record per date, summing sari cases and averaging weather
export function mergeStates(records: DailyRecord[]): DailyRecord[] {
  const groups = new Map<
    number,
    { date: Date; acc: Map<MetricId, { sum: number; count: number }> }
  >();

  for (const r of records) {
    const t = r.date.getTime();
    let g = groups.get(t);
    if (!g) {
      g = { date: r.date, acc: new Map() };
      groups.set(t, g);
    }
    for (const key of Object.keys(r.values) as MetricId[]) {
      const v = r.values[key];
      if (v === undefined) continue;
      const a = g.acc.get(key) ?? { sum: 0, count: 0 };
      a.sum += v;
      a.count += 1;
      g.acc.set(key, a);
    }
  }

  const out: DailyRecord[] = [];
  for (const g of groups.values()) {
    const values: Partial<Record<MetricId, number>> = {};
    for (const [key, a] of g.acc) {
      values[key] = METRICS[key].source === "sari" ? a.sum : a.sum / a.count;
    }
    out.push({ date: g.date, state: "ALL", values });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

export interface Bin {
  // lower edge of the bin
  start: number;
  // mean of the value metric over days in this bin
  mean: number;
  // sum over days in this bin
  sum: number;
  // number of days in this bin
  count: number;
}

// round a value down to its bin start
function binStart(value: number, binSize: number): number {
  return Math.floor(value / binSize) * binSize;
}

// group days by binned binMetric and average valueMetric per group
export function aggregateByBin(
  records: DailyRecord[],
  binMetric: MetricId,
  valueMetric: MetricId
): Bin[] {
  const binSize = METRICS[binMetric].binSize;
  const groups = new Map<number, { sum: number; count: number }>();

  for (const rec of records) {
    const x = rec.values[binMetric];
    const y = rec.values[valueMetric];
    if (x === undefined || y === undefined) continue;
    const start = binStart(x, binSize);
    const g = groups.get(start) ?? { sum: 0, count: 0 };
    g.sum += y;
    g.count += 1;
    groups.set(start, g);
  }

  return [...groups.entries()]
    .map(([start, g]) => ({
      start,
      sum: g.sum,
      count: g.count,
      mean: g.sum / g.count,
    }))
    .sort((a, b) => a.start - b.start);
}

// label for a bin like "0° to 10°" or "8 h"
export function binLabel(binMetric: MetricId, start: number): string {
  const { binSize, unit } = METRICS[binMetric];
  if (binSize === 1) return `${start} ${unit}`.trim();
  const end = start + binSize;
  return `${start} to ${end} ${unit}`.trim();
}
