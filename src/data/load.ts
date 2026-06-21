import { dsvFormat, csvParse } from "d3";
import type { MetricId } from "./metrics";
import { SARI_METRICS, type SariMetricId } from "./metrics";
import { parsePopulation, toPpm, type PopTable } from "./population";

export interface WeekRecord {
  date: Date;
  state: string;
  key: string;
  caseCounts?: Partial<Record<SariMetricId, number>>;
  values: Partial<Record<MetricId, number>>;
}

export interface Dataset {
  records: WeekRecord[];
  minDate: Date;
  maxDate: Date;
  population: PopTable;
}

const BASE = import.meta.env.BASE_URL;

const LOCATION_STATE: Record<string, string> = {
  "0": "BGL",
  "1": "KTN",
  "2": "NÖ",
  "3": "OÖ",
  "4": "SBG",
  "5": "ST",
  "6": "T",
  "7": "V",
  "8": "W",
};

const WEATHER_COLS: { col: string; id: MetricId; scale?: number }[] = [
  { col: "temperature_2m_mean (°C)", id: "temperature" },
  { col: "temperature_2m_max (°C)", id: "tempMax" },
  { col: "temperature_2m_min (°C)", id: "tempMin" },
  { col: "relative_humidity_2m_mean (%)", id: "humidity" },
  { col: "relative_humidity_2m_max (%)", id: "humidityMax" },
  { col: "relative_humidity_2m_min (%)", id: "humidityMin" },
  { col: "vapour_pressure_deficit_max (kPa)", id: "vpdMax" },
  { col: "sunshine_duration (s)", id: "sunshine", scale: 1 / 3600 },
];

type SariKey = SariMetricId;

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

function isoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1) + (week - 1) * 7);
  return monday;
}

const weekKey = (year: number, week: number) => `${year}-W${week}`;

function parseKw(label: string): { year: number; week: number } | null {
  const m = label.match(/(\d+)\.\s*KW\s*(\d{4})/);
  if (!m) return null;
  return { week: Number(m[1]), year: Number(m[2]) };
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

interface WeatherAgg {
  date: number;
  state: string;
  year: number;
  week: number;
  sums: Partial<Record<MetricId, number>>;
  counts: Partial<Record<MetricId, number>>;
}

export async function loadDataset(): Promise<Dataset> {
  const [sariText, weatherText, popText] = await Promise.all([
    fetchText(`${BASE}data/sari-data.csv`),
    fetchText(`${BASE}data/weather-data.csv`),
    fetchText(`${BASE}data/population.csv`),
  ]);

  const population = parsePopulation(popText);

  const sariByKey = new Map<string, Record<SariKey, number>>();
  dsvFormat(";").parse(sariText, (row) => {
    const kw = parseKw(row.KW ?? "");
    const state = row.WOHNORT;
    if (!kw || !state) return null;
    const key = `${state}|${weekKey(kw.year, kw.week)}`;
    let agg = sariByKey.get(key);
    if (!agg) {
      agg = { covid: 0, influenza: 0, aufnahmen: 0 };
      sariByKey.set(key, agg);
    }
    agg.covid += +(row.COVID ?? 0);
    agg.influenza += +(row.INFLUENZA ?? 0);
    agg.aufnahmen += +(row.AUFNAHMEN ?? 0);
    return null;
  });

  const weatherByKey = new Map<string, WeatherAgg>();
  csvParse(weatherText, (row) => {
    const state = LOCATION_STATE[String(row.location_id)];
    const timeStr = row.time;
    if (!state || !timeStr) return null;
    const date = new Date(`${timeStr}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    const wk = isoWeek(date);
    const key = `${state}|${weekKey(wk.year, wk.week)}`;

    let agg = weatherByKey.get(key);
    if (!agg) {
      agg = {
        date: date.getTime(),
        state,
        year: wk.year,
        week: wk.week,
        sums: {},
        counts: {},
      };
      weatherByKey.set(key, agg);
    }
    if (date.getTime() < agg.date) agg.date = date.getTime();

    for (const { col, id, scale } of WEATHER_COLS) {
      const raw = row[col];
      if (raw === undefined || raw === "") continue;
      const v = +raw * (scale ?? 1);
      if (Number.isNaN(v)) continue;
      agg.sums[id] = (agg.sums[id] ?? 0) + v;
      agg.counts[id] = (agg.counts[id] ?? 0) + 1;
    }
    return null;
  });

  const records: WeekRecord[] = [];
  let minDate = Infinity;
  let maxDate = -Infinity;

  for (const [key, agg] of weatherByKey) {
    const values: Partial<Record<MetricId, number>> = {};
    for (const { id } of WEATHER_COLS) {
      const count = agg.counts[id];
      if (count) values[id] = (agg.sums[id] as number) / count;
    }
    const sari = sariByKey.get(key);
    const date = isoWeekStart(agg.year, agg.week);
    let caseCounts: Partial<Record<SariMetricId, number>> | undefined;
    if (sari) {
      caseCounts = { covid: sari.covid, influenza: sari.influenza, aufnahmen: sari.aufnahmen };
      for (const id of SARI_METRICS) {
        values[id] = toPpm(sari[id], agg.state, date, population);
      }
    }

    const t = date.getTime();
    if (t < minDate) minDate = t;
    if (t > maxDate) maxDate = t;
    records.push({
      date,
      state: agg.state,
      key,
      caseCounts,
      values,
    });
  }

  records.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    records,
    minDate: new Date(minDate),
    maxDate: new Date(maxDate),
    population,
  };
}
