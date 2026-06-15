import type { DailyRecord } from "./load";
import { ALL_STATES } from "./metrics";

export interface RiskParams {
  temperature: number;
  precipitation: number;
  windSpeed: number;
}

// slider bounds, also used to clamp fetched values
export const RISK_RANGES = {
  temperature: { min: -15, max: 35, step: 0.5 },
  precipitation: { min: 0, max: 40, step: 0.5 },
  windSpeed: { min: 0, max: 25, step: 0.5 },
} as const;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v * 2) / 2));
}

// state capital coordinates, all states falls back to austria's center
const STATE_COORDS: Record<string, [number, number]> = {
  [ALL_STATES]: [47.5162, 14.5501],
  W: [48.2082, 16.3738],
  BGL: [47.8457, 16.5256],
  KTN: [46.6247, 14.3055],
  NÖ: [48.2047, 15.6256],
  OÖ: [48.3069, 14.2858],
  SBG: [47.8095, 13.055],
  ST: [47.0707, 15.4395],
  T: [47.2692, 11.4041],
  V: [47.5031, 9.7471],
};

// today's weather for a state from the open-meteo forecast api
export async function fetchTodayWeather(stateId: string): Promise<RiskParams> {
  const [lat, lon] = STATE_COORDS[stateId] ?? STATE_COORDS[ALL_STATES];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max` +
    `&wind_speed_unit=ms&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather api ${res.status}`);
  const json = await res.json();
  const d = json.daily;
  if (!d) throw new Error("no daily data");
  return {
    temperature: clamp(
      d.temperature_2m_mean?.[0] ?? 0,
      RISK_RANGES.temperature.min,
      RISK_RANGES.temperature.max
    ),
    precipitation: clamp(
      d.precipitation_sum?.[0] ?? 0,
      RISK_RANGES.precipitation.min,
      RISK_RANGES.precipitation.max
    ),
    windSpeed: clamp(
      d.wind_speed_10m_max?.[0] ?? 0,
      RISK_RANGES.windSpeed.min,
      RISK_RANGES.windSpeed.max
    ),
  };
}

export type RiskLevel = "low" | "moderate" | "high";

export interface RiskResult {
  percent: number;
  level: RiskLevel;
  advice: string;
  sampleDays: number;
}

function mean(a: number[]): number {
  return a.reduce((s, x) => s + x, 0) / a.length;
}

function std(a: number[], m: number): number {
  if (a.length < 2) return 1;
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length;
  return Math.sqrt(v) || 1;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base];
}

// estimate severe influenza risk for a hypothetical day of weather
export function computeRisk(records: DailyRecord[], p: RiskParams): RiskResult {
  const rows = records.filter(
    (r) =>
      r.values.temperature != null &&
      r.values.precipitation != null &&
      r.values.windSpeed != null &&
      r.values.influenza != null
  );
  if (rows.length === 0) {
    return {
      percent: 0,
      level: "low",
      advice: "No data for the current filters.",
      sampleDays: 0,
    };
  }

  const temps = rows.map((r) => r.values.temperature as number);
  const precs = rows.map((r) => r.values.precipitation as number);
  const winds = rows.map((r) => r.values.windSpeed as number);
  const flu = rows.map((r) => r.values.influenza as number);

  const sT = std(temps, mean(temps));
  const sP = std(precs, mean(precs));
  const sW = std(winds, mean(winds));

  // weight historical days by how close their weather is to the input
  const h = 0.6;
  let wsum = 0;
  let wflu = 0;
  for (let i = 0; i < rows.length; i++) {
    const dT = (temps[i] - p.temperature) / sT;
    const dP = (precs[i] - p.precipitation) / sP;
    const dW = (winds[i] - p.windSpeed) / sW;
    const w = Math.exp(-(dT * dT + dP * dP + dW * dW) / (2 * h * h));
    wsum += w;
    wflu += w * flu[i];
  }
  const predicted = wsum > 0 ? wflu / wsum : mean(flu);

  // scale against the historical spread of influenza days
  const sorted = [...flu].sort((a, b) => a - b);
  const lo = quantile(sorted, 0.05);
  const hi = quantile(sorted, 0.95);
  const percent = Math.max(0, Math.min(100, ((predicted - lo) / (hi - lo || 1)) * 100));

  const level: RiskLevel = percent >= 66 ? "high" : percent >= 33 ? "moderate" : "low";
  const advice =
    level === "high"
      ? "High risk — better stay home and rest."
      : level === "moderate"
      ? "Moderate risk — wear a mask and avoid crowds."
      : "Low risk — you're probably fine to head out.";

  return { percent, level, advice, sampleDays: rows.length };
}
