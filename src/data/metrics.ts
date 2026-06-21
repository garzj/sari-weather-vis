export type MetricId =
  | "covid"
  | "influenza"
  | "aufnahmen"
  | "temperature"
  | "tempMax"
  | "tempMin"
  | "dewMean"
  | "dewMax"
  | "dewMin"
  | "humidity"
  | "humidityMax"
  | "humidityMin"
  | "vpdMax"
  | "sunshine";

export type MetricSource = "sari" | "weather";

export interface MetricMeta {
  id: MetricId;
  label: string;
  unit: string;
  source: MetricSource;
  color: string;
}

export const METRICS: Record<MetricId, MetricMeta> = {
  covid: {
    id: "covid",
    label: "Covid cases",
    unit: "ppm",
    source: "sari",
    color: "#e15759",
  },
  influenza: {
    id: "influenza",
    label: "Severe influenza",
    unit: "ppm",
    source: "sari",
    color: "#59a14f",
  },
  aufnahmen: {
    id: "aufnahmen",
    label: "All infections",
    unit: "ppm",
    source: "sari",
    color: "#76b7b2",
  },
  temperature: {
    id: "temperature",
    label: "Average temperature",
    unit: "°C",
    source: "weather",
    color: "#f28e2b",
  },
  tempMax: {
    id: "tempMax",
    label: "Max temperature",
    unit: "°C",
    source: "weather",
    color: "#bf6f6f",
  },
  tempMin: {
    id: "tempMin",
    label: "Min temperature",
    unit: "°C",
    source: "weather",
    color: "#6f8cbf",
  },
  dewMean: {
    id: "dewMean",
    label: "Mean dew point",
    unit: "°C",
    source: "weather",
    color: "#4e79a7",
  },
  dewMax: {
    id: "dewMax",
    label: "Max dew point",
    unit: "°C",
    source: "weather",
    color: "#5b9bd5",
  },
  dewMin: {
    id: "dewMin",
    label: "Min dew point",
    unit: "°C",
    source: "weather",
    color: "#a0cbe8",
  },
  humidity: {
    id: "humidity",
    label: "Average humidity",
    unit: "%",
    source: "weather",
    color: "#2a9d8f",
  },
  humidityMax: {
    id: "humidityMax",
    label: "Max humidity",
    unit: "%",
    source: "weather",
    color: "#86bcb6",
  },
  humidityMin: {
    id: "humidityMin",
    label: "Min humidity",
    unit: "%",
    source: "weather",
    color: "#b6d7d2",
  },
  vpdMax: {
    id: "vpdMax",
    label: "Vapour pressure deficit",
    unit: "kPa",
    source: "weather",
    color: "#b07aa1",
  },
  sunshine: {
    id: "sunshine",
    label: "Sunshine hours",
    unit: "h",
    source: "weather",
    color: "#edc948",
  },
};

export const SARI_METRICS = ["covid", "influenza", "aufnahmen"] as const;

export type SariMetricId = (typeof SARI_METRICS)[number];

export const WEATHER_METRICS: MetricId[] = [
  "temperature",
  "tempMax",
  "tempMin",
  "dewMean",
  "dewMax",
  "dewMin",
  "humidity",
  "humidityMax",
  "humidityMin",
  "vpdMax",
  "sunshine",
];

export const LINE_METRICS: MetricId[] = [...SARI_METRICS, ...WEATHER_METRICS];

export const SCATTER_METRICS: MetricId[] = [
  "influenza",
  "temperature",
  "humidity",
  "vpdMax",
];

export const ALL_STATES = "ALL";

export const STATES: { id: string; name: string }[] = [
  { id: "W", name: "Vienna" },
  { id: "BGL", name: "Burgenland" },
  { id: "KTN", name: "Carinthia" },
  { id: "NÖ", name: "Lower Austria" },
  { id: "OÖ", name: "Upper Austria" },
  { id: "SBG", name: "Salzburg" },
  { id: "ST", name: "Styria" },
  { id: "T", name: "Tyrol" },
  { id: "V", name: "Vorarlberg" },
];
