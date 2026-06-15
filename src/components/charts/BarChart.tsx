import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { DailyRecord } from "../../data/load";
import { METRICS, type MetricId } from "../../data/metrics";
import { aggregateByBin, binLabel } from "../../data/aggregate";
import { useMeasure } from "../../hooks/useMeasure";

interface Props {
  records: DailyRecord[];
  xMetric: MetricId;
  yMetric: MetricId;
}

interface Tooltip {
  x: number;
  y: number;
  label: string;
  value: string;
  count: number;
}

const MARGIN = { top: 24, right: 24, bottom: 70, left: 70 };

export function BarChart({ records, xMetric, yMetric }: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!size.width || !size.height) return;

    const bins = aggregateByBin(records, xMetric, yMetric);
    const width = size.width;
    const height = size.height;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    if (bins.length === 0) {
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .text("No data for the current selection");
      return;
    }

    const x = d3
      .scaleBand<string>()
      .domain(bins.map((b) => binLabel(xMetric, b.start)))
      .range([0, innerW])
      .padding(0.15);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (b) => b.mean)!])
      .nice()
      .range([innerH, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .call((sel) => sel.selectAll("text").attr("fill", "#555"))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .attr("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .call((sel) => sel.selectAll("text").attr("fill", "#555"));

    g.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (b) => x(binLabel(xMetric, b.start)) ?? 0)
      .attr("y", (b) => y(b.mean))
      .attr("width", x.bandwidth())
      .attr("height", (b) => innerH - y(b.mean))
      .attr("fill", "#8ed16f")
      .attr("rx", 2)
      .style("cursor", "pointer")
      .on("mousemove", (event: MouseEvent, b) => {
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          label: binLabel(xMetric, b.start),
          value: `${b.mean.toFixed(2)} ${METRICS[yMetric].unit}`,
          count: b.count,
        });
      })
      .on("mouseleave", () => setTooltip(null));

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 60)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", 12)
      .text(METRICS[xMetric].label);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -54)
      .attr("text-anchor", "middle")
      .attr("fill", "#555")
      .attr("font-size", 12)
      .text(`Average ${METRICS[yMetric].label.toLowerCase()} per day`);
  }, [records, xMetric, yMetric, size]);

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
          <span className="tooltip-meta">{tooltip.count} days</span>
        </div>
      )}
    </div>
  );
}
