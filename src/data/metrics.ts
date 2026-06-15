// registry of every data attribute shown in the app
export type MetricId =
  // sari metrics, weekly source shown as per-day averages
  | "influenza"
  | "covid"
  | "rsv"
  | "pneumokokken"
  | "sonstige"
  | "aufnahmen"
  // weather metrics, daily source
  | "sunHours"
  | "temperature"
  | "tempMax"
  | "tempMin"
  | "precipitation"
  | "rain"
  | "snowfall"
  | "precipitationHours"
  | "windSpeed";

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
  // bin width when binned on a categorical axis
  binSize: number;
}

export const METRICS: Record<MetricId, MetricMeta> = {
  influenza: {
    id: "influenza",
    label: "Severe influenza cases",
    unit: "cases/day",
    source: "sari",
    color: "#59a14f",
    binSize: 1,
  },
  covid: {
    id: "covid",
    label: "Covid cases",
    unit: "cases/day",
    source: "sari",
    color: "#e15759",
    binSize: 1,
  },
  rsv: {
    id: "rsv",
    label: "RSV cases",
    unit: "cases/day",
    source: "sari",
    color: "#b07aa1",
    binSize: 1,
  },
  pneumokokken: {
    id: "pneumokokken",
    label: "Pneumococcal cases",
    unit: "cases/day",
    source: "sari",
    color: "#ff9da7",
    binSize: 1,
  },
  sonstige: {
    id: "sonstige",
    label: "Other infections",
    unit: "cases/day",
    source: "sari",
    color: "#9c755f",
    binSize: 1,
  },
  aufnahmen: {
    id: "aufnahmen",
    label: "All admissions",
    unit: "cases/day",
    source: "sari",
    color: "#76b7b2",
    binSize: 1,
  },
  sunHours: {
    id: "sunHours",
    label: "Sun hours",
    unit: "h",
    source: "weather",
    color: "#edc948",
    binSize: 1,
  },
  temperature: {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    source: "weather",
    color: "#9c9c9c",
    binSize: 10,
  },
  tempMax: {
    id: "tempMax",
    label: "Max temperature",
    unit: "°C",
    source: "weather",
    color: "#bf6f6f",
    binSize: 10,
  },
  tempMin: {
    id: "tempMin",
    label: "Min temperature",
    unit: "°C",
    source: "weather",
    color: "#6f8cbf",
    binSize: 10,
  },
  precipitation: {
    id: "precipitation",
    label: "Downfall intensity",
    unit: "mm",
    source: "weather",
    color: "#4e79a7",
    binSize: 2,
  },
  rain: {
    id: "rain",
    label: "Rain",
    unit: "mm",
    source: "weather",
    color: "#5b9bd5",
    binSize: 2,
  },
  snowfall: {
    id: "snowfall",
    label: "Snowfall",
    unit: "cm",
    source: "weather",
    color: "#a0cbe8",
    binSize: 1,
  },
  precipitationHours: {
    id: "precipitationHours",
    label: "Precipitation hours",
    unit: "h",
    source: "weather",
    color: "#86bcb6",
    binSize: 2,
  },
  windSpeed: {
    id: "windSpeed",
    label: "Wind speed",
    unit: "m/s",
    source: "weather",
    color: "#8cd17d",
    binSize: 2,
  },
};

// lines toggleable in the line chart
export const LINE_METRICS: MetricId[] = [
  "covid",
  "influenza",
  "sunHours",
  "precipitation",
  "temperature",
];

// sari metrics aggregatable as a per-day value
export const AGGREGATE_VALUE_METRICS: MetricId[] = [
  "influenza",
  "covid",
  "rsv",
  "pneumokokken",
  "sonstige",
  "aufnahmen",
];

// weather metrics binnable into categories
export const AGGREGATE_BIN_METRICS: MetricId[] = [
  "sunHours",
  "temperature",
  "tempMax",
  "tempMin",
  "precipitation",
  "windSpeed",
  "snowfall",
];

// variables selectable in the scatterplot matrix
export const SCATTER_METRICS: MetricId[] = [
  "influenza",
  "covid",
  "aufnahmen",
  "temperature",
  "sunHours",
  "precipitation",
  "windSpeed",
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
