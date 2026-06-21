import type { WeekRecord } from "./load";
import { SARI_METRICS, type MetricId, type SariMetricId } from "./metrics";
import { toPpm, type PopTable } from "./population";

function popState(states: Set<string>): string {
  return states.size === 1 ? [...states][0] : "ALL";
}

export function mergeByWeek(
  records: WeekRecord[],
  population: PopTable
): WeekRecord[] {
  const groups = new Map<
    number,
    {
      date: Date;
      acc: Map<MetricId, { sum: number; count: number }>;
      caseCounts: Partial<Record<SariMetricId, number>>;
      states: Set<string>;
    }
  >();

  for (const r of records) {
    const t = r.date.getTime();
    let g = groups.get(t);
    if (!g) {
      g = { date: r.date, acc: new Map(), caseCounts: {}, states: new Set() };
      groups.set(t, g);
    }
    g.states.add(r.state);
    if (r.caseCounts) {
      for (const id of SARI_METRICS) {
        const c = r.caseCounts[id];
        if (c) g.caseCounts[id] = (g.caseCounts[id] ?? 0) + c;
      }
    }
    for (const key of Object.keys(r.values) as MetricId[]) {
      if (SARI_METRICS.includes(key as SariMetricId)) continue;
      const v = r.values[key];
      if (v === undefined) continue;
      const a = g.acc.get(key) ?? { sum: 0, count: 0 };
      a.sum += v;
      a.count += 1;
      g.acc.set(key, a);
    }
  }

  const out: WeekRecord[] = [];
  for (const g of groups.values()) {
    const values: Partial<Record<MetricId, number>> = {};
    for (const [key, a] of g.acc) {
      values[key] = a.sum / a.count;
    }
    const state = popState(g.states);
    for (const id of SARI_METRICS) {
      const cases = g.caseCounts[id];
      if (cases) values[id] = toPpm(cases, state, g.date, population);
    }
    out.push({
      date: g.date,
      state,
      key: `ALL|${g.date.getTime()}`,
      caseCounts: Object.keys(g.caseCounts).length ? g.caseCounts : undefined,
      values,
    });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

export function stateTotals(
  records: WeekRecord[],
  metric: MetricId,
  population: PopTable
): Map<string, number> {
  if (!SARI_METRICS.includes(metric as SariMetricId)) {
    const totals = new Map<string, number>();
    for (const r of records) {
      const v = r.values[metric];
      if (v === undefined) continue;
      totals.set(r.state, (totals.get(r.state) ?? 0) + v);
    }
    return totals;
  }

  const casesByState = new Map<string, { cases: number; date: Date }>();
  for (const r of records) {
    const cases = r.caseCounts?.[metric as SariMetricId];
    if (!cases) continue;
    const prev = casesByState.get(r.state);
    casesByState.set(r.state, {
      cases: (prev?.cases ?? 0) + cases,
      date: r.date,
    });
  }

  const totals = new Map<string, number>();
  for (const [state, { cases, date }] of casesByState) {
    totals.set(state, toPpm(cases, state, date, population));
  }
  return totals;
}
