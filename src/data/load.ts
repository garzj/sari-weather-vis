import { dsvFormat, csvParse } from "d3";
import type { MetricId } from "./metrics";

// one day of merged weather + sari data for a state
export interface DailyRecord {
  date: Date;
  state: string;
  values: Partial<Record<MetricId, number>>;
}

export interface Dataset {
  records: DailyRecord[];
  // earliest and latest date in the weather data
  minDate: Date;
  maxDate: Date;
}

const BASE = import.meta.env.BASE_URL;

// iso-8601 calendar week and week-year, matches austrian "KW"
function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return { year: d.getUTCFullYear(), week };
}

const weekKey = (year: number, week: number) => `${year}-W${week}`;

// parse a sari "KW" label like "19. KW 2023"
function parseKw(label: string): { year: number; week: number } | null {
  const m = label.match(/(\d+)\.\s*KW\s*(\d{4})/);
  if (!m) return null;
  return { week: Number(m[1]), year: Number(m[2]) };
}

interface WeeklySari {
  covid: number;
  influenza: number;
  rsv: number;
  pneumokokken: number;
  sonstige: number;
  aufnahmen: number;
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

export async function loadDataset(): Promise<Dataset> {
  const [sariText, weatherText, locText] = await Promise.all([
    fetchText(`${BASE}data/sari-data.csv`),
    fetchText(`${BASE}data/weather-data.csv`),
    fetchText(`${BASE}data/weather-locations.csv`),
  ]);

  // location_id -> federal state
  const locById = new Map<string, string>();
  csvParse(locText, (row) => {
    locById.set(String(row.location_id), String(row.federal_state));
    return null;
  });

  // sum sari weekly counts per state and week
  const sariByKey = new Map<string, WeeklySari>();
  dsvFormat(";").parse(sariText, (row) => {
    const kw = parseKw(row.KW ?? "");
    const state = row.WOHNORT;
    if (!kw || !state) return null;
    const key = `${state}|${weekKey(kw.year, kw.week)}`;
    let agg = sariByKey.get(key);
    if (!agg) {
      agg = {
        covid: 0,
        influenza: 0,
        rsv: 0,
        pneumokokken: 0,
        sonstige: 0,
        aufnahmen: 0,
      };
      sariByKey.set(key, agg);
    }
    agg.covid += +(row.COVID ?? 0);
    agg.influenza += +(row.INFLUENZA ?? 0);
    agg.rsv += +(row.RSV ?? 0);
    agg.pneumokokken += +(row.PNEUMOKOKKEN ?? 0);
    agg.sonstige += +(row.SONSTIGE ?? 0);
    agg.aufnahmen += +(row.AUFNAHMEN ?? 0);
    return null;
  });

  // build daily records from the weather data
  const records: DailyRecord[] = [];
  let minDate = Infinity;
  let maxDate = -Infinity;

  csvParse(weatherText, (row) => {
    const state = locById.get(String(row.location_id));
    const timeStr = row.time;
    if (!state || !timeStr) return null;
    const date = new Date(`${timeStr}T00:00:00Z`);
    const t = date.getTime();
    if (Number.isNaN(t)) return null;
    if (t < minDate) minDate = t;
    if (t > maxDate) maxDate = t;

    const num = (key: string) => {
      const v = row[key];
      return v === undefined || v === "" ? undefined : +v;
    };
    const daylight = num("daylight_duration (s)");

    const values: Partial<Record<MetricId, number>> = {
      sunHours: daylight === undefined ? undefined : daylight / 3600,
      temperature: num("temperature_2m_mean (°C)"),
      tempMax: num("temperature_2m_max (°C)"),
      tempMin: num("temperature_2m_min (°C)"),
      precipitation: num("precipitation_sum (mm)"),
      rain: num("rain_sum (mm)"),
      snowfall: num("snowfall_sum (cm)"),
      precipitationHours: num("precipitation_hours (h)"),
      windSpeed: num("wind_speed_10m_max (m/s)"),
    };

    // attach the week's sari counts as a per-day average
    const wk = isoWeek(date);
    const sari = sariByKey.get(`${state}|${weekKey(wk.year, wk.week)}`);
    if (sari) {
      values.covid = sari.covid / 7;
      values.influenza = sari.influenza / 7;
      values.rsv = sari.rsv / 7;
      values.pneumokokken = sari.pneumokokken / 7;
      values.sonstige = sari.sonstige / 7;
      values.aufnahmen = sari.aufnahmen / 7;
    }

    records.push({ date, state, values });
    return null;
  });

  records.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    records,
    minDate: new Date(minDate),
    maxDate: new Date(maxDate),
  };
}
