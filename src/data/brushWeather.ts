import type { WeatherOptions } from "../appTypes";
import type { MetricId } from "./metrics";
import { WEATHER_RANGES, TOLERANCE_RANGES } from "./risk";

export interface SplomBrushState {
  xMetric: MetricId;
  yMetric: MetricId;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function brushFromWeather(w: WeatherOptions): SplomBrushState {
  return {
    xMetric: "temperature",
    yMetric: "humidity",
    x0: w.temperature - w.tempTolerance,
    x1: w.temperature + w.tempTolerance,
    y0: w.humidity - w.humidityTolerance,
    y1: w.humidity + w.humidityTolerance,
  };
}

export function isWeatherBrush(brush: SplomBrushState): boolean {
  const axes = new Set([brush.xMetric, brush.yMetric]);
  return axes.has("temperature") && axes.has("humidity");
}

export function asWeatherBrush(state: SplomBrushState): SplomBrushState {
  if (!isWeatherBrush(state)) return state;
  if (state.xMetric === "temperature" && state.yMetric === "humidity") {
    return state;
  }
  return {
    xMetric: "temperature",
    yMetric: "humidity",
    x0: state.y0,
    x1: state.y1,
    y0: state.x0,
    y1: state.x1,
  };
}

function weatherBoundsFromBrush(brush: SplomBrushState) {
  const canonical = asWeatherBrush(brush);
  return {
    temp0: canonical.x0,
    temp1: canonical.x1,
    hum0: canonical.y0,
    hum1: canonical.y1,
  };
}

export function weatherFromBrush(brush: SplomBrushState): Partial<WeatherOptions> {
  if (!isWeatherBrush(brush)) return {};
  const { temp0, temp1, hum0, hum1 } = weatherBoundsFromBrush(brush);
  return {
    temperature: (temp0 + temp1) / 2,
    tempTolerance: (temp1 - temp0) / 2,
    humidity: (hum0 + hum1) / 2,
    humidityTolerance: (hum1 - hum0) / 2,
  };
}

function clamp(v: number, min: number, max: number, step: number) {
  const snapped = Math.round(v / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

export function clampWeatherFromBrush(
  brush: SplomBrushState,
  fallback: WeatherOptions,
): WeatherOptions {
  const derived = weatherFromBrush(brush);
  return {
    temperature: clamp(
      derived.temperature ?? fallback.temperature,
      WEATHER_RANGES.temperature.min,
      WEATHER_RANGES.temperature.max,
      WEATHER_RANGES.temperature.step,
    ),
    humidity: clamp(
      derived.humidity ?? fallback.humidity,
      WEATHER_RANGES.humidity.min,
      WEATHER_RANGES.humidity.max,
      WEATHER_RANGES.humidity.step,
    ),
    tempTolerance: clamp(
      derived.tempTolerance ?? fallback.tempTolerance,
      TOLERANCE_RANGES.temperature.min,
      TOLERANCE_RANGES.temperature.max,
      TOLERANCE_RANGES.temperature.step,
    ),
    humidityTolerance: clamp(
      derived.humidityTolerance ?? fallback.humidityTolerance,
      TOLERANCE_RANGES.humidity.min,
      TOLERANCE_RANGES.humidity.max,
      TOLERANCE_RANGES.humidity.step,
    ),
  };
}
