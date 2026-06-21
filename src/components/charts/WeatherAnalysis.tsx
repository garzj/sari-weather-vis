import { WEATHER_RANGES, TOLERANCE_RANGES } from '../../data/risk';
import type { WeatherOptions } from '../../appTypes';

interface Props {
  params: WeatherOptions;
  onChange: (patch: Partial<WeatherOptions>) => void;
  onFetchWeek: () => void;
  showSyncApply: boolean;
  onSyncApply: () => void;
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
    <label className='field slider-field'>
      <span className='field-label'>
        {label}
        <span className='slider-value'>
          {value} {unit}
        </span>
      </span>
      <input
        type='range'
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
  params,
  onChange,
  onFetchWeek,
  showSyncApply,
  onSyncApply,
  fetching,
  error,
}: Props) {
  return (
    <section className='tile tile-weather'>
      <div className='weather-title-row'>
        <h2 className='tile-title'>Week&apos;s weather</h2>
        <button
          type='button'
          className={`weather-sync-apply${showSyncApply ? '' : ' is-hidden'}`}
          onClick={onSyncApply}
          tabIndex={showSyncApply ? 0 : -1}
          aria-hidden={!showSyncApply}
        >
          Apply
        </button>
      </div>
      <div className='weather-body'>
        <div className='weather-controls'>
          <SliderRow
            label='Temperature'
            unit='°C'
            value={params.temperature}
            min={WEATHER_RANGES.temperature.min}
            max={WEATHER_RANGES.temperature.max}
            step={WEATHER_RANGES.temperature.step}
            onChange={(temperature) => onChange({ temperature })}
          />
          <SliderRow
            label='Humidity'
            unit='%'
            value={params.humidity}
            min={WEATHER_RANGES.humidity.min}
            max={WEATHER_RANGES.humidity.max}
            step={WEATHER_RANGES.humidity.step}
            onChange={(humidity) => onChange({ humidity })}
          />
          <button
            type='button'
            className='weather-apply'
            onClick={onFetchWeek}
            disabled={fetching}
          >
            {fetching ? (
              <span className='spinner' aria-label='Fetching' />
            ) : (
              'Current week'
            )}
          </button>
          <SliderRow
            label='± Temperature'
            unit='°C'
            value={params.tempTolerance}
            min={TOLERANCE_RANGES.temperature.min}
            max={TOLERANCE_RANGES.temperature.max}
            step={TOLERANCE_RANGES.temperature.step}
            onChange={(tempTolerance) => onChange({ tempTolerance })}
          />
          <SliderRow
            label='± Humidity'
            unit='%'
            value={params.humidityTolerance}
            min={TOLERANCE_RANGES.humidity.min}
            max={TOLERANCE_RANGES.humidity.max}
            step={TOLERANCE_RANGES.humidity.step}
            onChange={(humidityTolerance) => onChange({ humidityTolerance })}
          />
          {error && <span className='risk-fetch-error'>{error}</span>}
        </div>
      </div>
    </section>
  );
}
