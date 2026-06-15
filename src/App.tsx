import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";
import { useDataset } from "./hooks/useDataset";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { Tabs } from "./components/Tabs";
import { LineChart } from "./components/charts/LineChart";
import { BarChart } from "./components/charts/BarChart";
import { PieChart } from "./components/charts/PieChart";
import { ScatterPlot } from "./components/charts/ScatterPlot";
import { RiskMeter } from "./components/charts/RiskMeter";
import { CHARTS, DEFAULT_OPTIONS, type ChartOptions } from "./appTypes";
import { ALL_STATES, type MetricId } from "./data/metrics";
import { mergeStates } from "./data/aggregate";
import { fetchTodayWeather } from "./data/risk";

const slideVariants = {
  enter: (d: number) => ({ x: d >= 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (d: number) => ({ x: d >= 0 ? "-100%" : "100%" }),
};

function App() {
  const { dataset, loading, error } = useDataset();

  const [stateId, setStateId] = useState("W");
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [chartIndex, setChartIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [options, setOptions] = useState<ChartOptions>(DEFAULT_OPTIONS);
  const [riskFetching, setRiskFetching] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // switch to a tab, remembering the slide direction
  const goTab = (i: number, direction?: number) => {
    setDir(direction ?? (i > chartIndex ? 1 : -1));
    setChartIndex(i);
  };

  // default the time window to the full range once data loads
  const fromDate = useMemo(
    () => from ?? dataset?.minDate ?? new Date(),
    [from, dataset]
  );
  const toDate = useMemo(
    () => to ?? dataset?.maxDate ?? new Date(),
    [to, dataset]
  );

  const filtered = useMemo(() => {
    if (!dataset) return [];
    const lo = fromDate.getTime();
    const hi = toDate.getTime();
    const inRange = dataset.records.filter(
      (r) => r.date.getTime() >= lo && r.date.getTime() <= hi
    );
    if (stateId === ALL_STATES) return mergeStates(inRange);
    return inRange.filter((r) => r.state === stateId);
  }, [dataset, stateId, fromDate, toDate]);

  const chart = CHARTS[chartIndex];

  const toggleLine = (id: MetricId) =>
    setOptions((o) => {
      const enabled = o.line.enabled.includes(id)
        ? o.line.enabled.filter((m) => m !== id)
        : [...o.line.enabled, id];
      return { ...o, line: { enabled } };
    });

  const patchBar = (patch: Partial<ChartOptions["bar"]>) =>
    setOptions((o) => ({ ...o, bar: { ...o.bar, ...patch } }));

  const patchPie = (patch: Partial<ChartOptions["pie"]>) =>
    setOptions((o) => ({ ...o, pie: { ...o.pie, ...patch } }));

  const toggleScatter = (id: MetricId) =>
    setOptions((o) => {
      const has = o.scatter.columns.includes(id);
      if (has && o.scatter.columns.length <= 2) return o; // keep at least two columns
      const columns = has
        ? o.scatter.columns.filter((m) => m !== id)
        : [...o.scatter.columns, id];
      return { ...o, scatter: { columns } };
    });

  const patchRisk = (patch: Partial<ChartOptions["risk"]>) =>
    setOptions((o) => ({ ...o, risk: { ...o.risk, ...patch } }));

  // fetch today's weather for the current state and apply it to the sliders
  const loadTodayWeather = async (state: string) => {
    setRiskFetching(true);
    setRiskError(null);
    try {
      const w = await fetchTodayWeather(state);
      patchRisk(w);
    } catch {
      setRiskError("Could not fetch weather");
    } finally {
      setRiskFetching(false);
    }
  };

  // load today's weather once on start
  useEffect(() => {
    loadTodayWeather(stateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // arrow keys switch tabs, unless the user is typing in a field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      if (e.key === "ArrowRight") {
        setDir(1);
        setChartIndex((i) => (i + 1) % CHARTS.length);
      } else if (e.key === "ArrowLeft") {
        setDir(-1);
        setChartIndex((i) => (i - 1 + CHARTS.length) % CHARTS.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="layout">
      {dataset && (
        <LeftSidebar
          state={stateId}
          onStateChange={setStateId}
          from={fromDate}
          to={toDate}
          onFromChange={setFrom}
          onToChange={setTo}
          minDate={dataset.minDate}
          maxDate={dataset.maxDate}
        />
      )}

      <Tabs charts={CHARTS} active={chartIndex} onChange={goTab} />

      <RightSidebar
        chartType={chart.type}
        options={options}
        onToggleLine={toggleLine}
        onBarChange={patchBar}
        onPieChange={patchPie}
        onToggleScatter={toggleScatter}
      />

      <div className="chart-area">
        {loading && <div className="status">Loading data…</div>}
        {error && <div className="status status-error">Error: {error}</div>}
        {dataset && (
          <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={chart.type}
                className="chart-pane"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {chart.type === "line" && (
                  <LineChart records={filtered} enabled={options.line.enabled} />
                )}
                {chart.type === "bar" && (
                  <BarChart
                    records={filtered}
                    xMetric={options.bar.x}
                    yMetric={options.bar.y}
                  />
                )}
                {chart.type === "pie" && (
                  <PieChart
                    records={filtered}
                    valueMetric={options.pie.value}
                    binMetric={options.pie.bin}
                  />
                )}
                {chart.type === "scatter" && (
                  <ScatterPlot
                    records={filtered}
                    columns={options.scatter.columns}
                  />
                )}
                {chart.type === "risk" && (
                  <RiskMeter
                    records={filtered}
                    params={options.risk}
                    onChange={patchRisk}
                    onUseToday={() => loadTodayWeather(stateId)}
                    fetching={riskFetching}
                    error={riskError}
                  />
                )}
              </motion.div>
            </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default App;
