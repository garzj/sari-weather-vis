// registry of every data attribute shown in the app
export type MetricId =
  // sari metrics, weekly counts
  | "covid"
  | "influenza"
  | "aufnahmen"
  // weather metrics, weekly averages of the daily source
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
  // short label for legends and dropdowns
  label: string;
  // unit shown in tooltips and axis titles
  unit: string;
  source: MetricSource;
  // line and legend color
  color: string;
}

export const METRICS: Record<MetricId, MetricMeta> = {
  covid: {
    id: "covid",
    label: "Covid cases",
    unit: "cases/week",
    source: "sari",
    color: "#e15759",
  },
  influenza: {
    id: "influenza",
    label: "Severe influenza cases",
    unit: "cases/week",
    source: "sari",
    color: "#59a14f",
  },
  aufnahmen: {
    id: "aufnahmen",
    label: "All infections",
    unit: "cases/week",
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

// sari metrics shown in the line chart options
export const SARI_METRICS: MetricId[] = ["covid", "influenza", "aufnahmen"];

// weather metrics shown in the line chart options
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

// lines toggleable in the line chart: sari first, then every weather field
export const LINE_METRICS: MetricId[] = [...SARI_METRICS, ...WEATHER_METRICS];

// fixed columns of the brushable scatterplot matrix
export const SCATTER_METRICS: MetricId[] = [
  "aufnahmen",
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
