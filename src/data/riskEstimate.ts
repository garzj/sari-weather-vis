import type { WeekRecord } from "./load";
import { SARI_METRICS, type MetricId, type SariMetricId } from "./metrics";

export const INFECTION_THRESHOLD_PPM = 30;

export type EmpiricalRisk = "too-little" | "low" | "increased";

function enabledSariMetrics(enabled: MetricId[]): SariMetricId[] {
  return SARI_METRICS.filter((id) => enabled.includes(id));
}

function weekAboveThreshold(
  record: WeekRecord,
  metrics: SariMetricId[],
): boolean {
  return metrics.some((id) => {
    const ppm = record.values[id];
    return ppm !== undefined && ppm >= INFECTION_THRESHOLD_PPM;
  });
}

export function estimateEmpiricalRisk(
  records: WeekRecord[],
  enabled: MetricId[],
): EmpiricalRisk {
  const sariEnabled = enabledSariMetrics(enabled);
  if (sariEnabled.length === 0 || records.length <= 10) return "too-little";
  const above = records.filter((r) =>
    weekAboveThreshold(r, sariEnabled),
  ).length;
  if (above >= 5) return "increased";
  return "low";
}
