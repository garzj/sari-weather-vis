import type { WeekRecord } from "./load";
import { ALL_STATES } from "./metrics";

export interface WeatherParams {
  temperature: number;
  humidity: number;
}

export const WEATHER_RANGES = {
  temperature: { min: -15, max: 35, step: 0.5 },
  humidity: { min: 0, max: 100, step: 1 },
} as const;

export const MATCH_TOLERANCE = {
  temperature: 3,
  humidity: 8,
} as const;

function clamp(v: number, min: number, max: number, step: number) {
  const snapped = Math.round(v / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

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

function mean(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

export async function fetchTodayWeather(
  stateId: string
): Promise<WeatherParams> {
  const [lat, lon] = STATE_COORDS[stateId] ?? STATE_COORDS[ALL_STATES];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather api ${res.status}`);
  const json = await res.json();
  const h = json.hourly;
  if (!h) throw new Error("no hourly data");
  return {
    temperature: clamp(
      mean(h.temperature_2m ?? []),
      WEATHER_RANGES.temperature.min,
      WEATHER_RANGES.temperature.max,
      WEATHER_RANGES.temperature.step
    ),
    humidity: clamp(
      mean(h.relative_humidity_2m ?? []),
      WEATHER_RANGES.humidity.min,
      WEATHER_RANGES.humidity.max,
      WEATHER_RANGES.humidity.step
    ),
  };
}

export interface MatchResult {
  matchedWeeks: number;
  totalWeeks: number;
  peopleAffected: number;
}

export function matchWeeks(
  records: WeekRecord[],
  p: WeatherParams
): MatchResult {
  const usable = records.filter(
    (r) => r.values.temperature != null && r.values.humidity != null
  );
  let matchedWeeks = 0;
  let peopleAffected = 0;
  for (const r of usable) {
    const dT = Math.abs((r.values.temperature as number) - p.temperature);
    const dH = Math.abs((r.values.humidity as number) - p.humidity);
    if (dT <= MATCH_TOLERANCE.temperature && dH <= MATCH_TOLERANCE.humidity) {
      matchedWeeks += 1;
      peopleAffected += Math.round(r.values.influenza ?? 0);
    }
  }
  return { matchedWeeks, totalWeeks: usable.length, peopleAffected };
}
