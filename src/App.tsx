import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useDataset } from "./hooks/useDataset";
import { TopLeftCard } from "./components/TopLeftCard";
import { OptionsCard } from "./components/OptionsCard";
import { AustriaMap } from "./components/charts/AustriaMap";
import { ScatterPlot } from "./components/charts/ScatterPlot";
import { LineChart } from "./components/charts/LineChart";
import { WeatherAnalysis } from "./components/charts/WeatherAnalysis";
import { DEFAULT_OPTIONS, type ChartOptions } from "./appTypes";
import { ALL_STATES, type MetricId } from "./data/metrics";
import { mergeByWeek } from "./data/aggregate";
import { fetchTodayWeather } from "./data/risk";
import { toDateInput, fromDateInput } from "./utils/date";
import type { WeekRecord } from "./data/load";

const MAP_METRIC: MetricId = "influenza";

function App() {
  const { dataset, loading, error } = useDataset();

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [options, setOptions] = useState<ChartOptions>(DEFAULT_OPTIONS);
  const [selection, setSelection] = useState<WeekRecord[] | null>(null);
  const [weatherFetching, setWeatherFetching] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fromDate = useMemo(
    () => from ?? dataset?.minDate ?? new Date(),
    [from, dataset]
  );
  const toDate = useMemo(
    () => to ?? dataset?.maxDate ?? new Date(),
    [to, dataset]
  );

  const rangeRecords = useMemo(() => {
    if (!dataset) return [];
    const lo = fromDate.getTime();
    const hi = toDate.getTime();
    return dataset.records.filter(
      (r) => r.date.getTime() >= lo && r.date.getTime() <= hi
    );
  }, [dataset, fromDate, toDate]);

  const filtered = useMemo(() => {
    if (!selectedState) return rangeRecords;
    return rangeRecords.filter((r) => r.state === selectedState);
  }, [rangeRecords, selectedState]);

  const handleStateChange = useCallback((s: string | null) => {
    setSelectedState(s);
    setSelection(null);
  }, []);
  const handleFromChange = useCallback((d: Date) => {
    setFrom(d);
    setSelection(null);
  }, []);
  const handleToChange = useCallback((d: Date) => {
    setTo(d);
    setSelection(null);
  }, []);

  const lineRecords = useMemo(
    () => mergeByWeek(selection ?? filtered),
    [selection, filtered]
  );

  const weatherRecords = useMemo(() => mergeByWeek(filtered), [filtered]);

  const toggleLine = (id: MetricId) =>
    setOptions((o) => {
      const enabled = o.line.enabled.includes(id)
        ? o.line.enabled.filter((m) => m !== id)
        : [...o.line.enabled, id];
      return { ...o, line: { enabled } };
    });

  const patchWeather = (patch: Partial<ChartOptions["weather"]>) =>
    setOptions((o) => ({ ...o, weather: { ...o.weather, ...patch } }));

  const handleSelect = useCallback((recs: WeekRecord[] | null) => {
    setSelection(recs && recs.length ? recs : null);
  }, []);

  const loadTodayWeather = useCallback(async (state: string | null) => {
    setWeatherFetching(true);
    setWeatherError(null);
    try {
      const w = await fetchTodayWeather(state ?? ALL_STATES);
      setOptions((o) => ({ ...o, weather: { ...o.weather, ...w } }));
    } catch {
      setWeatherError("Could not fetch weather");
    } finally {
      setWeatherFetching(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTodayWeather(null);
  }, [loadTodayWeather]);

  if (loading) return <div className="status">Loading data…</div>;
  if (error || !dataset)
    return <div className="status status-error">Error: {error}</div>;

  return (
    <div className="layout">
      <TopLeftCard />

      <section className="tile tile-map">
        <h2 className="tile-title">Austria — click a state to filter</h2>
        <div className="tile-dates">
          <input
            type="date"
            value={toDateInput(fromDate)}
            min={toDateInput(dataset.minDate)}
            max={toDateInput(toDate)}
            onChange={(e) => handleFromChange(fromDateInput(e.target.value))}
          />
          <span className="date-sep">–</span>
          <input
            type="date"
            value={toDateInput(toDate)}
            min={toDateInput(fromDate)}
            max={toDateInput(dataset.maxDate)}
            onChange={(e) => handleToChange(fromDateInput(e.target.value))}
          />
        </div>
        <div className="tile-body">
          <AustriaMap
            records={rangeRecords}
            metric={MAP_METRIC}
            selectedState={selectedState}
            onSelectState={handleStateChange}
          />
        </div>
      </section>

      <OptionsCard enabled={options.line.enabled} onToggle={toggleLine} />

      <section className="tile tile-chart tile-line">
        <h2 className="tile-title">
          Line graph{selection ? " — brushed weeks" : ""}
        </h2>
        <div className="tile-body">
          <LineChart records={lineRecords} enabled={options.line.enabled} />
        </div>
      </section>

      <div className="right-col">
        <section className="tile tile-chart tile-scatter">
          <h2 className="tile-title">Scatterplot — brush to filter</h2>
          <div className="tile-body">
            <ScatterPlot
              records={filtered}
              columns={options.scatter.columns}
              onSelect={handleSelect}
            />
          </div>
        </section>

        <WeatherAnalysis
          records={weatherRecords}
          params={options.weather}
          onChange={patchWeather}
          onUseToday={() => loadTodayWeather(selectedState)}
          fetching={weatherFetching}
          error={weatherError}
        />
      </div>
    </div>
  );
}

export default App;
