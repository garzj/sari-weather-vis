import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { FeatureCollection, Geometry } from "geojson";
import type { WeekRecord } from "../../data/load";
import { stateTotals, type AgeContext } from "../../data/aggregate";
import { METRICS, SARI_METRICS, type MetricId } from "../../data/metrics";
import type { PopTable } from "../../data/population";
import { useMeasure } from "../../hooks/useMeasure";

interface Props {
  records: WeekRecord[];
  metric: MetricId;
  population: PopTable;
  ageContext?: AgeContext;
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
}

const NAME_TO_STATE: Record<string, string> = {
  Wien: "W",
  Burgenland: "BGL",
  Kärnten: "KTN",
  Niederösterreich: "NÖ",
  Oberösterreich: "OÖ",
  Salzburg: "SBG",
  Steiermark: "ST",
  Tirol: "T",
  Vorarlberg: "V",
};

type StateFeatureCollection = FeatureCollection<Geometry, { name: string }>;

export function AustriaMap({
  records,
  metric,
  population,
  ageContext,
  selectedState,
  onSelectState,
}: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<StateFeatureCollection | null>(null);
  const [hover, setHover] = useState<{ name: string; value: number } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}geo/austria-states.geojson`)
      .then((r) => r.json())
      .then((json: StateFeatureCollection) => {
        if (!cancelled) setGeo(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (!geo || !size.width || !size.height) return;

    const totals = stateTotals(records, metric, population, ageContext);
    const max = d3.max([...totals.values()]) ?? 0;
    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, max || 1]);

    const pad = 6;
    const projection = d3
      .geoMercator()
      .fitExtent(
        [
          [pad, pad],
          [Math.max(pad * 2, size.width - pad), Math.max(pad * 2, size.height - pad)],
        ],
        geo
      );
    const path = d3.geoPath(projection);

    svg
      .append("g")
      .selectAll<SVGPathElement, (typeof geo.features)[number]>("path")
      .data(geo.features)
      .join("path")
      .attr("d", (d) => path(d) ?? "")
      .attr("class", "map-state")
      .classed("selected", (d) => NAME_TO_STATE[d.properties.name] === selectedState)
      .classed(
        "dimmed",
        (d) =>
          selectedState !== null &&
          NAME_TO_STATE[d.properties.name] !== selectedState
      )
      .attr("fill", (d) => {
        const code = NAME_TO_STATE[d.properties.name];
        return color(totals.get(code) ?? 0);
      })
      .on("mouseenter", (_event, d) => {
        const code = NAME_TO_STATE[d.properties.name];
        setHover({ name: d.properties.name, value: totals.get(code) ?? 0 });
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (_event, d) => {
        const code = NAME_TO_STATE[d.properties.name];
        onSelectState(code === selectedState ? null : code);
      });
  }, [geo, records, metric, population, ageContext, selectedState, size, onSelectState]);

  const formatValue = (v: number) =>
    SARI_METRICS.includes(metric as (typeof SARI_METRICS)[number])
      ? v.toFixed(1)
      : Math.round(v).toString();

  return (
    <div className="map-wrap">
      <div className="map-svg-area" ref={wrapRef}>
        <svg ref={svgRef} width={size.width} height={size.height} />
      </div>
      <div className="map-caption">
        {hover
          ? `${hover.name}: ${formatValue(hover.value)} ${METRICS[metric].unit}`
          : selectedState
          ? "Click the state again to clear the filter"
          : `Total ${METRICS[metric].label.toLowerCase()} — click a state to filter`}
      </div>
    </div>
  );
}
