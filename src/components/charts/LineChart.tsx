import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { WeekRecord } from "../../data/load";
import { METRICS, type MetricId } from "../../data/metrics";
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

    const line = d3
      .line<{ date: Date; norm: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.norm))
      .curve(d3.curveMonotoneX);

    for (const id of enabled) {
      const meta = METRICS[id];
      const points = records
        .filter((r) => r.values[id] !== undefined)
        .map((r) => ({ date: r.date, value: r.values[id] as number }));
      if (points.length === 0) continue;

      const min = d3.min(points, (p) => p.value)!;
      const max = d3.max(points, (p) => p.value)!;
      const span = max - min || 1;
      const normPoints = points.map((p) => ({
        date: p.date,
        norm: (p.value - min) / span,
        value: p.value,
      }));

      const path = g
        .append("path")
        .datum(normPoints)
        .attr("fill", "none")
        .attr("stroke", meta.color)
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("d", line)
        .style("cursor", "pointer");

      g.append("path")
        .datum(normPoints)
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 12)
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mousemove", (event: MouseEvent) => {
          path.attr("stroke-width", 4);
          const [mx] = d3.pointer(event, svgRef.current);
          const date = x.invert(mx - MARGIN.left);
          const bisect = d3.bisector(
            (p: { date: Date }) => p.date
          ).center;
          const idx = bisect(normPoints, date);
          const nearest = normPoints[idx];
          setTooltip({
            x: event.offsetX,
            y: event.offsetY,
            label: meta.label,
            value: `${nearest.value.toFixed(1)} ${meta.unit}`,
            color: meta.color,
          });
        })
        .on("mouseleave", () => {
          path.attr("stroke-width", 2);
          setTooltip(null);
        });
    }
  }, [records, enabled, size]);

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg ref={svgRef} width={size.width} height={size.height} />
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <span className="tooltip-swatch" style={{ background: tooltip.color }} />
          <strong>{tooltip.label}</strong>
          <span className="tooltip-value">{tooltip.value}</span>
        </div>
      )}
    </div>
  );
}
