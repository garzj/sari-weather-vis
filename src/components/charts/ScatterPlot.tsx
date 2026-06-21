import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { WeekRecord } from '../../data/load';
import { METRICS, type MetricId } from '../../data/metrics';
import { useMeasure } from '../../hooks/useMeasure';
import {
  seasonOf,
  SEASONS,
  SEASON_COLORS,
  type Season,
} from '../../utils/date';

export interface SplomBrushState {
  xMetric: MetricId;
  yMetric: MetricId;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Props {
  records: WeekRecord[];
  columns: MetricId[];
  onSelect: (records: WeekRecord[] | null) => void;
  brushState: SplomBrushState | null;
  onBrushChange: (state: SplomBrushState | null) => void;
}

interface Point {
  rec: WeekRecord;
  season: Season;
  values: Partial<Record<MetricId, number>>;
  cx: number[];
  cy: number[];
}

const PADDING = 28;

export function ScatterPlot({
  records,
  columns,
  onSelect,
  brushState,
  onBrushChange,
}: Props) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cleanup = () => {};
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (!size.width || !size.height) return;

    const side = Math.min(size.width, size.height);
    if (columns.length < 2 || side <= 0) return;

    const n = columns.length;
    const width = side;
    const cellSize = (width - (n + 1) * PADDING) / n + PADDING;

    const points: Point[] = records.map((r) => ({
      rec: r,
      season: seasonOf(r.date),
      values: r.values,
      cx: [],
      cy: [],
    }));

    const x = columns.map((c) =>
      d3
        .scaleLinear()
        .domain(d3.extent(points, (p) => p.values[c]) as [number, number])
        .nice()
        .range([PADDING / 2, cellSize - PADDING / 2]),
    );
    const y = x.map((scale) =>
      scale.copy().range([cellSize - PADDING / 2, PADDING / 2]),
    );

    for (const p of points) {
      for (let c = 0; c < n; c++) {
        const v = p.values[columns[c]];
        if (v === undefined) {
          p.cx[c] = NaN;
          p.cy[c] = NaN;
        } else {
          p.cx[c] = x[c](v);
          p.cy[c] = y[c](v);
        }
      }
    }

    const color = d3
      .scaleOrdinal<string>()
      .domain(SEASONS)
      .range(SEASONS.map((s) => SEASON_COLORS[s]));

    svg.attr('viewBox', [-PADDING, 0, width, width].join(' '));

    type LinScale = d3.ScaleLinear<number, number>;
    const axisX = d3
      .axisBottom<number>(x[0])
      .ticks(5)
      .tickSize(cellSize * n);
    svg
      .append('g')
      .selectAll<SVGGElement, LinScale>('g')
      .data(x)
      .join('g')
      .attr('transform', (_d, i) => `translate(${i * cellSize},0)`)
      .each(function (this: SVGGElement, d) {
        d3.select(this).call(axisX.scale(d));
      })
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', '#e3e5e9'))
      .call((g) => g.selectAll('.tick text').remove());

    const axisY = d3
      .axisLeft<number>(y[0])
      .ticks(5)
      .tickSize(-cellSize * n);
    svg
      .append('g')
      .selectAll<SVGGElement, LinScale>('g')
      .data(y)
      .join('g')
      .attr('transform', (_d, i) => `translate(0,${i * cellSize})`)
      .each(function (this: SVGGElement, d) {
        d3.select(this).call(axisY.scale(d));
      })
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', '#e3e5e9'))
      .call((g) => g.selectAll('.tick text').remove());

    const pairs: [number, number][] = d3.cross(d3.range(n), d3.range(n));
    const cell = svg
      .append('g')
      .selectAll<SVGGElement, [number, number]>('g')
      .data(pairs)
      .join('g')
      .attr(
        'transform',
        ([i, j]) => `translate(${i * cellSize},${j * cellSize})`,
      );

    cell
      .append('rect')
      .attr('class', 'splom-frame')
      .attr('fill', 'none')
      .attr('x', PADDING / 2 + 0.5)
      .attr('y', PADDING / 2 + 0.5)
      .attr('width', cellSize - PADDING)
      .attr('height', cellSize - PADDING);

    cell.each(function ([i, j]) {
      d3.select(this)
        .selectAll('circle')
        .data(
          points.filter(
            (p) => !Number.isNaN(p.cx[i]) && !Number.isNaN(p.cy[j]),
          ),
        )
        .join('circle')
        .attr('cx', (p) => p.cx[i])
        .attr('cy', (p) => p.cy[j]);
    });

    const circle = cell
      .selectAll<SVGCircleElement, Point>('circle')
      .attr('r', 3)
      .attr('fill-opacity', 0.6)
      .attr('fill', (p) => color(p.season))
      .attr('pointer-events', 'none');

    const cellKey = (i: number, j: number) => `${i}-${j}`;
    let activeKey: string | null = null;

    let rafId = 0;
    let pending: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      i: number;
      j: number;
    } | null = null;
    const applyHighlight = () => {
      rafId = 0;
      if (!pending) return;
      const { x0, y0, x1, y1, i, j } = pending;
      const selected: WeekRecord[] = [];
      circle.classed('hidden', (p) => {
        const px = p.cx[i];
        const py = p.cy[j];
        const out = x0 > px || x1 < px || y0 > py || y1 < py;
        if (!out) selected.push(p.rec);
        return out;
      });
      onSelect(selected);
    };

    const brush = d3
      .brush<[number, number]>()
      .extent([
        [PADDING / 2, PADDING / 2],
        [cellSize - PADDING / 2, cellSize - PADDING / 2],
      ])
      .on('start', (_event, [i, j]) => {
        const key = cellKey(i, j);
        if (activeKey && activeKey !== key) {
          cell
            .filter((d) => cellKey(d[0], d[1]) === activeKey)
            .call(brush.move, null);
        }
        activeKey = key;
      })
      .on('brush', (event: d3.D3BrushEvent<[number, number]>, [i, j]) => {
        const selection = event.selection as
          | [[number, number], [number, number]]
          | null;
        if (!selection) return;
        const [[x0, y0], [x1, y1]] = selection;
        pending = { x0, y0, x1, y1, i, j };
        if (!rafId) rafId = requestAnimationFrame(applyHighlight);
      })
      .on('end', (event: d3.D3BrushEvent<[number, number]>, [i, j]) => {
        if (restoring) return;
        const selection = event.selection as
          | [[number, number], [number, number]]
          | null;
        if (selection) {
          const [[px0, py0], [px1, py1]] = selection;
          onBrushChange({
            xMetric: columns[i],
            yMetric: columns[j],
            x0: Math.min(x[i].invert(px0), x[i].invert(px1)),
            x1: Math.max(x[i].invert(px0), x[i].invert(px1)),
            y0: Math.min(y[j].invert(py0), y[j].invert(py1)),
            y1: Math.max(y[j].invert(py0), y[j].invert(py1)),
          });
          return;
        }
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        pending = null;
        activeKey = null;
        circle.classed('hidden', false);
        onBrushChange(null);
        onSelect(null);
      });

    cell.call(brush);

    let restoring = false;

    const restoreBrush = (state: SplomBrushState) => {
      const i = columns.indexOf(state.xMetric);
      const j = columns.indexOf(state.yMetric);
      if (i < 0 || j < 0) return;
      const extentMin = PADDING / 2;
      const extentMax = cellSize - PADDING / 2;
      const px0 = Math.min(x[i](state.x0), x[i](state.x1));
      const px1 = Math.max(x[i](state.x0), x[i](state.x1));
      const py0 = Math.min(y[j](state.y0), y[j](state.y1));
      const py1 = Math.max(y[j](state.y0), y[j](state.y1));
      const cx0 = Math.max(extentMin, px0);
      const cx1 = Math.min(extentMax, px1);
      const cy0 = Math.max(extentMin, py0);
      const cy1 = Math.min(extentMax, py1);
      if (cx1 <= cx0 || cy1 <= cy0) return;
      activeKey = cellKey(i, j);
      cell.each(function (d) {
        if (d[0] !== i || d[1] !== j) {
          d3.select(this).call(
            brush.move as (
              sel: d3.Selection<SVGGElement, unknown, null, undefined>,
              s: null,
            ) => void,
            null,
          );
        }
      });
      cell.filter((d) => d[0] === i && d[1] === j).each(function () {
        d3.select(this).call(
          brush.move as (
            sel: d3.Selection<SVGGElement, unknown, null, undefined>,
            s: [[number, number], [number, number]],
          ) => void,
          [
            [cx0, cy0],
            [cx1, cy1],
          ],
        );
      });
      pending = { x0: cx0, y0: cy0, x1: cx1, y1: cy1, i, j };
      applyHighlight();
    };

    if (brushState) {
      restoring = true;
      restoreBrush(brushState);
      restoring = false;
    }

    cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
    };

    const labelX = PADDING / 2 + 4;
    const labelY = PADDING / 2 + 4;
    svg
      .append('g')
      .style('font', "600 11px 'Segoe UI', sans-serif")
      .style('pointer-events', 'none')
      .selectAll('text')
      .data(columns)
      .join('text')
      .attr(
        'transform',
        (_d, i) => `translate(${i * cellSize},${i * cellSize})`,
      )
      .attr('x', labelX)
      .attr('y', labelY)
      .attr('fill', '#1f2430')
      .each(function (d) {
        const meta = METRICS[d];
        const el = d3.select(this);
        el.append('tspan').attr('x', labelX).attr('dy', '0').text(meta.label);
        el.append('tspan')
          .attr('x', labelX)
          .attr('dy', '1.15em')
          .text(`in ${meta.unit}`);
      });

    return () => cleanup();
  }, [records, columns, size, onSelect, onBrushChange, brushState]);

  return (
    <div className='chart-wrap splom'>
      <div className='splom-chart' ref={wrapRef}>
        <svg ref={svgRef} width={size.width} height={size.height} />
      </div>
      <div className='splom-legend'>
        {SEASONS.map((s) => (
          <span key={s} className='splom-legend-item'>
            <span
              className='splom-legend-swatch'
              style={{ background: SEASON_COLORS[s] }}
            />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
