import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";
import type { WeekRecord } from "../../data/load";
import {
  LINE_SCALE_GROUPS,
  METRICS,
  SARI_METRICS,
  lineScaleGroup,
  type MetricId,
  type SariMetricId,
} from "../../data/metrics";
import { useMeasure } from "../../hooks/useMeasure";

interface Props {
  records: WeekRecord[];
  enabled: MetricId[];
}

interface Tooltip {
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
}

const MARGIN = { top: 24, right: 24, bottom: 40, left: 40 };
const WEEK_MS = 7 * 86_400_000;
const SARI_LINE_WIDTH = 4.5;
const SARI_LINE_HOVER = 7.5;
const WEATHER_LINE_WIDTH = 2.625;
const WEATHER_LINE_HOVER = 4.5;
const SARI_DOT_R = 3;
const SARI_DOT_R_HOVER = 4.5;
const TICK_W = 9;
const TICK_H = 3;
const TICK_W_HOVER = 12;
const TICK_H_HOVER = 3.75;
const LINE_HIT_WIDTH = 18;

function isSari(id: MetricId): id is SariMetricId {
  return SARI_METRICS.includes(id as SariMetricId);
}

interface NormPoint {
  date: Date;
  norm: number;
  value: number;
}

function isConsecutiveWeek(prev: Date, next: Date): boolean {
  return next.getTime() - prev.getTime() === WEEK_MS;
}

function splitSegments(points: NormPoint[]): NormPoint[][] {
  if (points.length === 0) return [];
  const segments: NormPoint[][] = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    if (isConsecutiveWeek(points[i - 1].date, points[i].date)) {
      segments[segments.length - 1].push(points[i]);
    } else {
      segments.push([points[i]]);
    }
  }
  return segments;
}

function groupExtents(
  records: WeekRecord[],
  ids: MetricId[]
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const r of records) {
    for (const id of ids) {
      const v = r.values[id];
      if (v === undefined) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) return null;
  return { min, max };
}

export function LineChart({ records, enabled }: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!size.width || !size.height || records.length === 0) return;

    const width = size.width;
    const height = size.height;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(records, (d) => d.date) as [Date, Date])
      .range([0, innerW]);

    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom<Date>(x).ticks(Math.max(2, Math.floor(innerW / 100))))
      .call((sel) => sel.selectAll("text").attr("fill", "#555"));
    g.append("line")
      .attr("class", "axis-line")
      .attr("y2", innerH)
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 34)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", 12)
      .text("Time");

    const sharedScale = new Map<string, { min: number; max: number }>();
    for (const [group, ids] of Object.entries(LINE_SCALE_GROUPS)) {
      const active = ids.filter((id) => enabled.includes(id));
      if (active.length === 0) continue;
      const ext = groupExtents(records, active);
      if (ext) sharedScale.set(group, ext);
    }

    const line = d3
      .line<NormPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.norm))
      .curve(d3.curveMonotoneX);

    const sariSet = new Set<MetricId>(SARI_METRICS);
    const drawOrder = [
      ...enabled.filter((id) => !sariSet.has(id)),
      ...enabled.filter((id) => sariSet.has(id)),
    ];

    for (const id of drawOrder) {
      const meta = METRICS[id];
      const sari = isSari(id);
      const lineWidth = sari ? SARI_LINE_WIDTH : WEATHER_LINE_WIDTH;
      const hoverWidth = sari ? SARI_LINE_HOVER : WEATHER_LINE_HOVER;
      const points = records
        .filter((r) => r.values[id] !== undefined)
        .map((r) => ({ date: r.date, value: r.values[id] as number }));
      if (points.length === 0) continue;

      const group = lineScaleGroup(id);
      const shared = group ? sharedScale.get(group) : null;
      let min: number;
      let max: number;
      if (shared) {
        min = shared.min;
        max = shared.max;
      } else {
        min = d3.min(points, (p) => p.value)!;
        max = d3.max(points, (p) => p.value)!;
      }
      const span = max - min || 1;
      const normPoints: NormPoint[] = points.map((p) => ({
        date: p.date,
        norm: (p.value - min) / span,
        value: p.value,
      }));

      const series = g.append("g").attr("class", "line-series");
      const segments = splitSegments(normPoints);
      const connected = segments.filter((seg) => seg.length >= 2);
      const isolated = segments.filter((seg) => seg.length === 1).map((seg) => seg[0]);

      const paths = series
        .selectAll<SVGPathElement, NormPoint[]>("path.line-segment")
        .data(connected)
        .join("path")
        .attr("class", "line-segment")
        .attr("fill", "none")
        .attr("stroke", meta.color)
        .attr("stroke-width", lineWidth)
        .attr("stroke-linejoin", "round")
        .attr("stroke-dasharray", sari ? null : "7.5 6")
        .attr("d", line)
        .style("cursor", "pointer");

      series
        .selectAll<SVGPathElement, NormPoint[]>("path.line-hit")
        .data(connected)
        .join("path")
        .attr("class", "line-hit")
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", LINE_HIT_WIDTH)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseenter", () => paths.attr("stroke-width", hoverWidth))
        .on("mousemove", function (event: MouseEvent, seg: NormPoint[]) {
          const [mx] = d3.pointer(event, svgRef.current);
          const date = x.invert(mx - MARGIN.left);
          const idx = d3.bisector((p: NormPoint) => p.date).center(seg, date);
          const nearest = seg[idx];
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            label: meta.label,
            value: `${nearest.value.toFixed(1)} ${meta.unit}`,
            color: meta.color,
          });
        })
        .on("mouseleave", () => {
          paths.attr("stroke-width", lineWidth);
          setTooltip(null);
        });

      if (sari) {
        series
          .selectAll<SVGCircleElement, NormPoint>("circle.line-isolated")
          .data(isolated)
          .join("circle")
          .attr("class", "line-isolated")
          .attr("cx", (d) => x(d.date))
          .attr("cy", (d) => y(d.norm))
          .attr("r", SARI_DOT_R)
          .attr("fill", meta.color)
          .style("cursor", "pointer")
          .on("mouseenter", function () {
            d3.select(this).attr("r", SARI_DOT_R_HOVER);
          })
          .on("mousemove", (event: MouseEvent, d: NormPoint) => {
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              label: meta.label,
              value: `${d.value.toFixed(1)} ${meta.unit}`,
              color: meta.color,
            });
          })
          .on("mouseleave", function () {
            d3.select(this).attr("r", SARI_DOT_R);
            setTooltip(null);
          });
      } else {
        series
          .selectAll<SVGRectElement, NormPoint>("rect.line-isolated")
          .data(isolated)
          .join("rect")
          .attr("class", "line-isolated")
          .attr("x", (d) => x(d.date) - TICK_W / 2)
          .attr("y", (d) => y(d.norm) - TICK_H / 2)
          .attr("width", TICK_W)
          .attr("height", TICK_H)
          .attr("rx", 0.5)
          .attr("fill", meta.color)
          .style("cursor", "pointer")
          .on("mouseenter", function (_event, d) {
            const el = d3.select(this);
            el.attr("width", TICK_W_HOVER).attr("height", TICK_H_HOVER);
            el
              .attr("x", x(d.date) - TICK_W_HOVER / 2)
              .attr("y", y(d.norm) - TICK_H_HOVER / 2);
          })
          .on("mousemove", (event: MouseEvent, d: NormPoint) => {
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              label: meta.label,
              value: `${d.value.toFixed(1)} ${meta.unit}`,
              color: meta.color,
            });
          })
          .on("mouseleave", function (_event, d) {
            const el = d3.select(this);
            el.attr("width", TICK_W).attr("height", TICK_H);
            el
              .attr("x", x(d.date) - TICK_W / 2)
              .attr("y", y(d.norm) - TICK_H / 2);
            setTooltip(null);
          });
      }
    }
  }, [records, enabled, size]);

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg ref={svgRef} width={size.width} height={size.height} />
      {tooltip &&
        createPortal(
          <div
            className="tooltip tooltip-floating"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <span
              className="tooltip-swatch"
              style={{ background: tooltip.color }}
            />
            <strong>{tooltip.label}</strong>
            <span className="tooltip-value">{tooltip.value}</span>
          </div>,
          document.body
        )}
    </div>
  );
}
