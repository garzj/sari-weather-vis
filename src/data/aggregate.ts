import type { WeekRecord } from "./load";
import { METRICS, type MetricId } from "./metrics";

// merge records that fall in the same week (across states) into one row:
// sari counts are summed, weather metrics are averaged. used by the line chart
// and weather analysis so multi-state selections collapse to one series.
export function mergeByWeek(records: WeekRecord[]): WeekRecord[] {
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

  const out: WeekRecord[] = [];
  for (const g of groups.values()) {
    const values: Partial<Record<MetricId, number>> = {};
    for (const [key, a] of g.acc) {
      values[key] = METRICS[key].source === "sari" ? a.sum : a.sum / a.count;
    }
    out.push({
      date: g.date,
      state: "ALL",
      key: `ALL|${g.date.getTime()}`,
      values,
    });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

// total of a sari metric per state, used to color the choropleth
export function stateTotals(
  records: WeekRecord[],
  metric: MetricId
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of records) {
    const v = r.values[metric];
    if (v === undefined) continue;
    totals.set(r.state, (totals.get(r.state) ?? 0) + v);
  }
  return totals;
}
