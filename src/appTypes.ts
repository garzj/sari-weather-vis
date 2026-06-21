import type { MetricId } from './data/metrics';
import { SCATTER_METRICS } from './data/metrics';

export interface WeatherOptions {
  temperature: number;
  humidity: number;
  tempTolerance: number;
  humidityTolerance: number;
}

export interface ChartOptions {
  line: { enabled: MetricId[] };
  scatter: { columns: MetricId[] };
  weather: WeatherOptions;
}

export const DEFAULT_OPTIONS: ChartOptions = {
  line: { enabled: ['influenza', 'temperature', 'vpdMax'] },
  scatter: { columns: SCATTER_METRICS },
  weather: {
    temperature: 5,
    humidity: 80,
    tempTolerance: 3,
    humidityTolerance: 8,
  },
};
