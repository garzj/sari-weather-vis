import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { DailyRecord } from "../../data/load";
import { METRICS, type MetricId } from "../../data/metrics";
import { aggregateByBin, binLabel, type Bin } from "../../data/aggregate";
import { useMeasure } from "../../hooks/useMeasure";

interface Props {
  records: DailyRecord[];
  // metric whose average sets each slice size ("portion")
  valueMetric: MetricId;
  // metric binned into slices ("cake piece")
  binMetric: MetricId;
}

interface Tooltip {
  x: number;
  y: number;
  label: string;
  value: string;
}

const PALETTE = [
  "#f28e2b",
  "#4e79a7",
  "#e15759",
  "#59a14f",
  "#76b7b2",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

export function PieChart({ records, valueMetric, binMetric }: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!size.width || !size.height) return;

    const bins = aggregateByBin(records, binMetric, valueMetric).filter(
      (b) => b.mean > 0
    );
    const width = size.width;
    const height = size.height;
    const radius = Math.max(0, Math.min(width, height) / 2 - 50);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    if (bins.length === 0 || radius <= 0) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .text("No data for the current selection");
      return;
    }

    const color = d3
      .scaleOrdinal<string>()
      .domain(bins.map((b) => String(b.start)))
      .range(PALETTE);

    const pie = d3
      .pie<Bin>()
      .sort(null)
      .value((b) => b.mean);
    const arc = d3.arc<d3.PieArcDatum<Bin>>().innerRadius(0).outerRadius(radius);
    const labelArc = d3
      .arc<d3.PieArcDatum<Bin>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    const arcs = pie(bins);

    g.selectAll("path")
      .data(arcs)
      .join("path")
      .attr("class", "pie-arc")
      .attr("d", arc)
      .attr("fill", (d) => color(String(d.data.start)))
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mousemove", (event: MouseEvent, d) => {
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          label: binLabel(binMetric, d.data.start),
          value: `${d.data.mean.toFixed(2)} ${METRICS[valueMetric].unit}`,
        });
      })
      .on("mouseleave", () => setTooltip(null));

    // slice labels only when wide enough for text
    g.selectAll("text.slice")
      .data(arcs)
      .join("text")
      .attr("class", "slice")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#1a1a1a")
      .text((d) =>
        d.endAngle - d.startAngle > 0.25 ? binLabel(binMetric, d.data.start) : ""
      );

    g.append("text")
      .attr("y", radius + 36)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", 12)
      .text(`Average ${METRICS[valueMetric].label.toLowerCase()} per day`);
  }, [records, valueMetric, binMetric, size]);

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg ref={svgRef} width={size.width} height={size.height} />
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <strong>{tooltip.label}</strong>
          <span className="tooltip-value">{tooltip.value}</span>
        </div>
      )}
    </div>
  );
}
