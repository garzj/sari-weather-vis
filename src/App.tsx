import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { useDataset } from './hooks/useDataset';
import { TopLeftCard } from './components/TopLeftCard';
import { OptionsCard } from './components/OptionsCard';
import { AustriaMap } from './components/charts/AustriaMap';
import { ScatterPlot } from './components/charts/ScatterPlot';
import { LineChart } from './components/charts/LineChart';
import { RiskEstimate } from './components/charts/RiskEstimate';
import { WeatherAnalysis } from './components/charts/WeatherAnalysis';
import { DEFAULT_OPTIONS, type ChartOptions } from './appTypes';
import { ALL_STATES, SARI_METRICS, type MetricId } from './data/metrics';
import { mergeByWeek } from './data/aggregate';
import { fetchCurrentWeekWeather } from './data/risk';
import {
  brushFromWeather,
  clampWeatherFromBrush,
  isWeatherBrush,
  type SplomBrushState,
} from './data/brushWeather';
import { AGE_GROUPS, AGE_LABELS, type AgeGroup } from './data/age';
import { recordsForAgeGroup } from './data/load';
import { toDateInput, fromDateInput } from './utils/date';
import type { WeekRecord } from './data/load';

const MAP_METRIC: MetricId = 'influenza';
const DEFAULT_FROM = new Date('2025-06-01T00:00:00Z');

function App() {
  const { dataset, loading, error } = useDataset();

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('all');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [options, setOptions] = useState<ChartOptions>(DEFAULT_OPTIONS);
  const [selection, setSelection] = useState<WeekRecord[] | null>(null);
  const [weatherFetching, setWeatherFetching] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherBrush, setWeatherBrush] = useState<SplomBrushState | null>(null);
  const [plotBrush, setPlotBrush] = useState<SplomBrushState | null>(null);
  const [plotTouched, setPlotTouched] = useState(false);

  const activeBrush = plotTouched ? plotBrush : weatherBrush;

  const fromDate = useMemo(
    () => from ?? DEFAULT_FROM,
    [from],
  );
  const toDate = useMemo(
    () => to ?? dataset?.maxDate ?? new Date(),
    [to, dataset],
  );

  const ageContext = useMemo(
    () =>
      dataset
        ? {
            group: ageGroup,
            agePop: dataset.agePopByState[ageGroup],
          }
        : null,
    [dataset, ageGroup],
  );

  const ageRecords = useMemo(() => {
    if (!dataset) return [];
    return recordsForAgeGroup(dataset.records, dataset, ageGroup);
  }, [dataset, ageGroup]);

  const rangeRecords = useMemo(() => {
    const lo = fromDate.getTime();
    const hi = toDate.getTime();
    return ageRecords.filter(
      (r) => r.date.getTime() >= lo && r.date.getTime() <= hi,
    );
  }, [ageRecords, fromDate, toDate]);

  const filtered = useMemo(() => {
    if (!selectedState) return rangeRecords;
    return rangeRecords.filter((r) => r.state === selectedState);
  }, [rangeRecords, selectedState]);

  const clearBrush = useCallback(() => {
    setSelection(null);
    setWeatherBrush(null);
    setPlotBrush(null);
    setPlotTouched(false);
  }, []);

  const clearPlotFilter = useCallback(() => {
    setSelection(null);
    setPlotBrush(null);
    setPlotTouched(true);
  }, []);

  const handleStateChange = useCallback((s: string | null) => {
    setSelectedState(s);
    clearBrush();
  }, [clearBrush]);
  const handleAgeChange = useCallback((group: AgeGroup) => {
    setAgeGroup(group);
    clearBrush();
  }, [clearBrush]);
  const handleFromChange = useCallback((d: Date) => {
    setFrom(d);
    clearBrush();
  }, [clearBrush]);
  const handleToChange = useCallback((d: Date) => {
    setTo(d);
    clearBrush();
  }, [clearBrush]);

  const lineRecords = useMemo(() => {
    if (!dataset || !ageContext) return [];
    const source = activeBrush === null ? filtered : (selection ?? []);
    return mergeByWeek(source, dataset.population, ageContext);
  }, [activeBrush, selection, filtered, dataset, ageContext]);

  const lineBrushEmpty =
    activeBrush !== null && selection !== null && selection.length === 0;

  const toggleLine = (id: MetricId) =>
    setOptions((o) => {
      const isEnabled = o.line.enabled.includes(id);
      if (isEnabled) {
        const isSari = (SARI_METRICS as readonly MetricId[]).includes(id);
        const enabledSari = SARI_METRICS.filter((m) => o.line.enabled.includes(m));
        if (isSari && enabledSari.length <= 1) return o;
        return {
          ...o,
          line: { enabled: o.line.enabled.filter((m) => m !== id) },
        };
      }
      return { ...o, line: { enabled: [...o.line.enabled, id] } };
    });

  const patchWeather = useCallback((patch: Partial<ChartOptions['weather']>) => {
    setOptions((o) => {
      const weather = { ...o.weather, ...patch };
      setWeatherBrush(brushFromWeather(weather));
      setPlotTouched(false);
      return { ...o, weather };
    });
  }, []);

  const handleSelect = useCallback((recs: WeekRecord[] | null) => {
    setSelection(recs);
  }, []);

  const handlePlotBrush = useCallback((state: SplomBrushState | null) => {
    setPlotBrush(state);
    setPlotTouched(true);
  }, []);

  const showWeatherSyncApply = plotTouched;

  const syncWeatherFromBrush = useCallback(() => {
    setOptions((o) => {
      const weather =
        plotBrush && isWeatherBrush(plotBrush)
          ? clampWeatherFromBrush(plotBrush, o.weather)
          : o.weather;
      setWeatherBrush(brushFromWeather(weather));
      setPlotBrush(null);
      setPlotTouched(false);
      return { ...o, weather };
    });
  }, [plotBrush]);

  const loadCurrentWeekWeather = useCallback(
    async (state: string | null, updateBrush = true) => {
      setWeatherFetching(true);
      setWeatherError(null);
      try {
        const w = await fetchCurrentWeekWeather(state ?? ALL_STATES);
        setOptions((o) => {
          const weather = { ...o.weather, ...w };
          if (updateBrush) {
            setWeatherBrush(brushFromWeather(weather));
            setPlotTouched(false);
          }
          return { ...o, weather };
        });
      } catch {
        setWeatherError('Could not fetch weather');
      } finally {
        setWeatherFetching(false);
      }
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCurrentWeekWeather(null);
  }, [loadCurrentWeekWeather]);

  if (loading) return <div className='status'>Loading data…</div>;
  if (error || !dataset)
    return <div className='status status-error'>Error: {error}</div>;

  return (
    <div className='layout'>
      <TopLeftCard />

      <section className='tile tile-map'>
        <h2 className='tile-title'>Austria — click a state to filter</h2>
        <div className='tile-dates'>
          <input
            type='date'
            value={toDateInput(fromDate)}
            min={toDateInput(dataset.minDate)}
            max={toDateInput(toDate)}
            onChange={(e) => handleFromChange(fromDateInput(e.target.value))}
          />
          <span className='date-sep'>–</span>
          <input
            type='date'
            value={toDateInput(toDate)}
            min={toDateInput(fromDate)}
            max={toDateInput(dataset.maxDate)}
            onChange={(e) => handleToChange(fromDateInput(e.target.value))}
          />
        </div>
        <div className='tile-body map-body'>
          <div className='map-controls-overlay'>
            <select
              className='map-age-select'
              value={ageGroup}
              onChange={(e) => handleAgeChange(e.target.value as AgeGroup)}
              aria-label='Age group'
            >
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {AGE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <AustriaMap
            records={rangeRecords}
            metric={MAP_METRIC}
            population={dataset.population}
            ageContext={ageContext ?? undefined}
            selectedState={selectedState}
            onSelectState={handleStateChange}
          />
        </div>
      </section>

      <OptionsCard enabled={options.line.enabled} onToggle={toggleLine} />

      <section className='tile tile-chart tile-line'>
        <div className='line-title-row'>
          <h2 className='tile-title'>
            Line graph{activeBrush ? ' — brushed weeks' : ''}
          </h2>
          {activeBrush && (
            <RiskEstimate
              records={lineRecords}
              enabled={options.line.enabled}
            />
          )}
        </div>
        <div className='tile-body'>
          <LineChart
            records={lineRecords}
            enabled={options.line.enabled}
            showEmpty={lineBrushEmpty}
          />
        </div>
      </section>

      <div className='right-col'>
        <WeatherAnalysis
          params={options.weather}
          onChange={patchWeather}
          onFetchWeek={() => loadCurrentWeekWeather(selectedState, true)}
          showSyncApply={showWeatherSyncApply}
          onSyncApply={syncWeatherFromBrush}
          fetching={weatherFetching}
          error={weatherError}
        />

        <section className='tile tile-chart tile-scatter'>
          <div
            className={`tile-title-row${activeBrush ? ' tile-title-row--with-action' : ''}`}
          >
            <h2 className='tile-title'>
              Weekly cases vs weather — brush to filter
            </h2>
            {activeBrush && (
              <button
                type='button'
                className='tile-title-action'
                onClick={clearPlotFilter}
              >
                Clear
              </button>
            )}
          </div>
          <div className='tile-body'>
            <ScatterPlot
              records={filtered}
              columns={options.scatter.columns}
              onSelect={handleSelect}
              brushState={activeBrush}
              onPlotBrush={handlePlotBrush}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
