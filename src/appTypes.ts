import type { MetricId } from "./data/metrics";
import { SCATTER_METRICS } from "./data/metrics";

export interface ChartOptions {
  line: { enabled: MetricId[] };
  scatter: { columns: MetricId[] };
  weather: { temperature: number; humidity: number };
}

export const DEFAULT_OPTIONS: ChartOptions = {
  line: { enabled: ["aufnahmen", "temperature", "humidity"] },
  scatter: { columns: SCATTER_METRICS },
  weather: { temperature: 5, humidity: 80 },
};
