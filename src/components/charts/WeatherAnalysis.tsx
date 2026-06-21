import { useMemo } from "react";
import type { WeekRecord } from "../../data/load";
import {
  matchWeeks,
  MATCH_TOLERANCE,
  WEATHER_RANGES,
  type WeatherParams,
} from "../../data/risk";

interface Props {
  records: WeekRecord[];
  params: WeatherParams;
  onChange: (patch: Partial<WeatherParams>) => void;
  onUseToday: () => void;
  fetching: boolean;
  error: string | null;
}

function SliderRow({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field slider-field">
      <span className="field-label">
        {label}
        <span className="slider-value">
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

export function WeatherAnalysis({
  records,
  params,
  onChange,
  onUseToday,
  fetching,
  error,
}: Props) {
  const result = useMemo(() => matchWeeks(records, params), [records, params]);

  return (
    <section className="tile tile-weather">
      <h2 className="tile-title">Weather analysis</h2>
      <div className="weather-body">
        <div className="weather-controls">
          <SliderRow
            label="Temperature"
            unit="°C"
            value={params.temperature}
            min={WEATHER_RANGES.temperature.min}
            max={WEATHER_RANGES.temperature.max}
            step={WEATHER_RANGES.temperature.step}
            onChange={(temperature) => onChange({ temperature })}
          />
          <SliderRow
            label="Humidity"
            unit="%"
            value={params.humidity}
            min={WEATHER_RANGES.humidity.min}
            max={WEATHER_RANGES.humidity.max}
            step={WEATHER_RANGES.humidity.step}
            onChange={(humidity) => onChange({ humidity })}
          />
          <button
            type="button"
            className="risk-fetch"
            onClick={onUseToday}
            disabled={fetching}
          >
            {fetching ? (
              <span className="spinner" aria-label="Fetching" />
            ) : (
              "Use today's weather"
            )}
          </button>
          {error && <span className="risk-fetch-error">{error}</span>}
        </div>

        <div className="weather-result">
          <div className="weather-stat">
            <span className="weather-stat-value">{result.matchedWeeks}</span>
            <span className="weather-stat-label">
              of {result.totalWeeks} weeks with similar weather
            </span>
          </div>
          <div className="weather-stat">
            <span className="weather-stat-value">{result.peopleAffected}</span>
            <span className="weather-stat-label">
              severe influenza cases in those weeks
            </span>
          </div>
          <p className="weather-note">
            "Similar" means within ±{MATCH_TOLERANCE.temperature} °C and ±
            {MATCH_TOLERANCE.humidity} % of the chosen values, over the current
            time range and state.
          </p>
        </div>
      </div>
    </section>
  );
}
