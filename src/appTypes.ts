import type { MetricId } from "./data/metrics";

export type ChartType = "line" | "bar" | "pie" | "scatter" | "risk";

export interface ChartInfo {
  type: ChartType;
  title: string;
}

export const CHARTS: ChartInfo[] = [
  { type: "risk", title: "Infection risk" },
  { type: "line", title: "Line graph" },
  { type: "bar", title: "Aggregates" },
  { type: "pie", title: "Pie chart" },
  { type: "scatter", title: "Scatterplot" },
];

export interface ChartOptions {
  line: { enabled: MetricId[] };
  bar: { x: MetricId; y: MetricId };
  pie: { value: MetricId; bin: MetricId };
  scatter: { columns: MetricId[] };
  risk: { temperature: number; precipitation: number; windSpeed: number };
}

export const DEFAULT_OPTIONS: ChartOptions = {
  line: { enabled: ["influenza", "temperature"] },
  bar: { x: "sunHours", y: "influenza" },
  pie: { value: "influenza", bin: "temperature" },
  scatter: { columns: ["influenza", "temperature", "sunHours"] },
  risk: { temperature: 5, precipitation: 3, windSpeed: 8 },
};
