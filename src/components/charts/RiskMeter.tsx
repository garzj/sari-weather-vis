import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { DailyRecord } from "../../data/load";
import { computeRisk, RISK_RANGES, type RiskParams } from "../../data/risk";
import { METRICS } from "../../data/metrics";
import { useMeasure } from "../../hooks/useMeasure";

interface Props {
  records: DailyRecord[];
  params: RiskParams;
  onChange: (patch: Partial<RiskParams>) => void;
  onUseToday: () => void;
  fetching: boolean;
  error: string | null;
}

const LEVEL_COLOR = {
  low: "#3fae5a",
  moderate: "#e8a93b",
  high: "#e15759",
};

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

export function RiskMeter({
  records,
  params,
  onChange,
  onUseToday,
  fetching,
  error,
}: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);

  const risk = useMemo(() => computeRisk(records, params), [records, params]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!size.width || !size.height) return;

    const R = Math.min(size.width / 2 - 24, size.height - 110, 210);
    if (R <= 0) return;

    const cx = size.width / 2;
    // vertically center the gauge plus its text block
    const above = R;
    const below = R * 0.42 + 64;
    const cy = Math.max(R + 16, (size.height - (above + below)) / 2 + above);
    const inner = R * 0.64;

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    const arc = d3.arc().innerRadius(inner).outerRadius(R).cornerRadius(6);
    const start = -Math.PI / 2;
    const full = Math.PI;
    const frac = risk.percent / 100;

    // background track
    g.append("path")
      .attr(
        "d",
        arc({ startAngle: start, endAngle: start + full } as d3.DefaultArcObject)!
      )
      .style("fill", "var(--chart-grid)");

    // value arc
    g.append("path")
      .attr(
        "d",
        arc({
          startAngle: start,
          endAngle: start + full * frac,
        } as d3.DefaultArcObject)!
      )
      .style("fill", LEVEL_COLOR[risk.level]);

    // needle
    const theta = Math.PI * (1 - frac);
    const len = R * 0.9;
    g.append("line")
      .attr("x2", Math.cos(theta) * len)
      .attr("y2", -Math.sin(theta) * len)
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .style("stroke", "var(--text)");
    g.append("circle").attr("r", 7).style("fill", "var(--text)");

    // end labels
    g.append("text")
      .attr("x", -(inner + R) / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("fill", "var(--muted)")
      .style("font-size", "12px")
      .text("0%");
    g.append("text")
      .attr("x", (inner + R) / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("fill", "var(--muted)")
      .style("font-size", "12px")
      .text("100%");

    // percentage and advice below the gauge
    g.append("text")
      .attr("y", R * 0.42)
      .attr("text-anchor", "middle")
      .style("fill", LEVEL_COLOR[risk.level])
      .style("font-size", `${Math.round(R * 0.34)}px`)
      .style("font-weight", "700")
      .text(`${Math.round(risk.percent)}%`);

    g.append("text")
      .attr("y", R * 0.42 + 30)
      .attr("text-anchor", "middle")
      .style("fill", "var(--text)")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .text(risk.advice);

    const t = METRICS.temperature;
    const p = METRICS.precipitation;
    const w = METRICS.windSpeed;
    const summary =
      risk.sampleDays > 0
        ? `${params.temperature} ${t.unit} · ${params.precipitation} ${p.unit} downfall · ${params.windSpeed} ${w.unit} wind · based on ${risk.sampleDays} days`
        : "";
    g.append("text")
      .attr("y", R * 0.42 + 52)
      .attr("text-anchor", "middle")
      .style("fill", "var(--muted)")
      .style("font-size", "12px")
      .text(summary);
  }, [size, risk, params]);

  return (
    <div className="risk-layout">
      <div className="risk-controls">
        <SliderRow
          label={METRICS.temperature.label}
          unit={METRICS.temperature.unit}
          value={params.temperature}
          min={RISK_RANGES.temperature.min}
          max={RISK_RANGES.temperature.max}
          step={RISK_RANGES.temperature.step}
          onChange={(temperature) => onChange({ temperature })}
        />
        <SliderRow
          label="Downfall intensity"
          unit={METRICS.precipitation.unit}
          value={params.precipitation}
          min={RISK_RANGES.precipitation.min}
          max={RISK_RANGES.precipitation.max}
          step={RISK_RANGES.precipitation.step}
          onChange={(precipitation) => onChange({ precipitation })}
        />
        <SliderRow
          label={METRICS.windSpeed.label}
          unit={METRICS.windSpeed.unit}
          value={params.windSpeed}
          min={RISK_RANGES.windSpeed.min}
          max={RISK_RANGES.windSpeed.max}
          step={RISK_RANGES.windSpeed.step}
          onChange={(windSpeed) => onChange({ windSpeed })}
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
      <div className="chart-wrap risk-gauge" ref={wrapRef}>
        <svg ref={svgRef} width={size.width} height={size.height} />
      </div>
    </div>
  );
}
