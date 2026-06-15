import type { ChartInfo } from "../appTypes";

interface Props {
  charts: ChartInfo[];
  active: number;
  onChange: (index: number) => void;
}

export function Tabs({ charts, active, onChange }: Props) {
  const n = charts.length;
  return (
    <div className="tabs-wrap">
      <div className="tabs" role="tablist">
        {charts.map((c, i) => (
          <button
            key={c.type}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`tab${i === active ? " active" : ""}`}
            onClick={() => onChange(i)}
          >
            <span className="tab-label">{c.title}</span>
          </button>
        ))}
        <span
          className="tab-underline"
          style={{
            width: `${100 / n}%`,
            transform: `translateX(${active * 100}%)`,
          }}
        >
          <span className="tab-underline-bar" />
        </span>
      </div>

      <div className="tabs-compact">
        <button
          type="button"
          className="tab-arrow"
          aria-label="Previous tab"
          onClick={() => onChange((active - 1 + n) % n)}
        >
          ‹
        </button>
        <span className="tabs-compact-title">{charts[active].title}</span>
        <button
          type="button"
          className="tab-arrow"
          aria-label="Next tab"
          onClick={() => onChange((active + 1) % n)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
