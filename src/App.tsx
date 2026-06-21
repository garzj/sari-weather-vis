import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useDataset } from "./hooks/useDataset";
import { TopLeftCard } from "./components/TopLeftCard";
import { OptionsCard } from "./components/OptionsCard";
import { UploadCard } from "./components/UploadCard";
import { AustriaMap } from "./components/charts/AustriaMap";
import { ScatterPlot } from "./components/charts/ScatterPlot";
import { LineChart } from "./components/charts/LineChart";
import { WeatherAnalysis } from "./components/charts/WeatherAnalysis";
import { DEFAULT_OPTIONS, type ChartOptions } from "./appTypes";
import { ALL_STATES, type MetricId } from "./data/metrics";
import { mergeByWeek } from "./data/aggregate";
import { fetchTodayWeather } from "./data/risk";
import type { WeekRecord } from "./data/load";

// metric used to color the choropleth
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

  // records in the time range, every state (drives the map)
  const rangeRecords = useMemo(() => {
    if (!dataset) return [];
    const lo = fromDate.getTime();
    const hi = toDate.getTime();
    return dataset.records.filter(
      (r) => r.date.getTime() >= lo && r.date.getTime() <= hi
    );
  }, [dataset, fromDate, toDate]);

  // range + selected state (drives the scatterplot and weather analysis)
  const filtered = useMemo(() => {
    if (!selectedState) return rangeRecords;
    return rangeRecords.filter((r) => r.state === selectedState);
  }, [rangeRecords, selectedState]);

  // changing the filter invalidates a brush made against the old data
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

  // line chart: brushed subset (or everything), merged to one row per week
  const lineRecords = useMemo(
    () => mergeByWeek(selection ?? filtered),
    [selection, filtered]
  );

  // weather analysis: one row per week over the current filter
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

      <UploadCard
        from={fromDate}
        to={toDate}
        minDate={dataset.minDate}
        maxDate={dataset.maxDate}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
      />

      <section className="tile tile-map">
        <h2 className="tile-title">Austria — click a state to filter</h2>
        <div className="tile-body">
          <AustriaMap
            records={rangeRecords}
            metric={MAP_METRIC}
            selectedState={selectedState}
            onSelectState={handleStateChange}
          />
        </div>
      </section>

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

      <OptionsCard enabled={options.line.enabled} onToggle={toggleLine} />

      <section className="tile tile-chart tile-line">
        <h2 className="tile-title">
          Line graph{selection ? " — brushed weeks" : ""}
        </h2>
        <div className="tile-body">
          <LineChart records={lineRecords} enabled={options.line.enabled} />
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

      <section className="tile tile-empty" />
    </div>
  );
}

export default App;
