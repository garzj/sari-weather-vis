import { motion } from "framer-motion";
import {
  METRICS,
  LINE_METRICS,
  AGGREGATE_VALUE_METRICS,
  AGGREGATE_BIN_METRICS,
  SCATTER_METRICS,
  type MetricId,
} from "../data/metrics";
import type { ChartOptions, ChartType } from "../appTypes";

interface Props {
  chartType: ChartType;
  options: ChartOptions;
  onToggleLine: (id: MetricId) => void;
  onBarChange: (patch: Partial<ChartOptions["bar"]>) => void;
  onPieChange: (patch: Partial<ChartOptions["pie"]>) => void;
  onToggleScatter: (id: MetricId) => void;
}

function CheckRow({
  checked,
  color,
  label,
  disabled,
  onToggle,
}: {
  checked: boolean;
  color: string;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <motion.span
        className="checkbox-box"
        animate={{
          backgroundColor: checked ? color : "rgba(0,0,0,0)",
          borderColor: color,
          scale: checked ? [1, 1.25, 1] : [1, 0.85, 1],
        }}
        transition={{
          scale: { duration: 0.3, ease: "backOut" },
          backgroundColor: { duration: 0.1 },
          borderColor: { duration: 0.1 },
        }}
      />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}

function MetricSelect({
  value,
  ids,
  onChange,
}: {
  value: MetricId;
  ids: MetricId[];
  onChange: (id: MetricId) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as MetricId)}>
      {ids.map((id) => (
        <option key={id} value={id}>
          {METRICS[id].label}
        </option>
      ))}
    </select>
  );
}

export function RightSidebar({
  chartType,
  options,
  onToggleLine,
  onBarChange,
  onPieChange,
  onToggleScatter,
}: Props) {
  return (
    <aside className="sidebar sidebar-right">
      <h2 className="options-title">
        {chartType === "risk" ? "Description" : "Options"}
      </h2>

      {chartType === "line" && (
        <div className="checkbox-list">
          {LINE_METRICS.map((id) => {
            const meta = METRICS[id];
            return (
              <CheckRow
                key={id}
                checked={options.line.enabled.includes(id)}
                color={meta.color}
                label={meta.label}
                onToggle={() => onToggleLine(id)}
              />
            );
          })}
        </div>
      )}

      {chartType === "bar" && (
        <div className="select-list">
          <label className="field">
            <span className="field-label">Y-Axis</span>
            <MetricSelect
              value={options.bar.y}
              ids={AGGREGATE_VALUE_METRICS}
              onChange={(y) => onBarChange({ y })}
            />
          </label>
          <label className="field">
            <span className="field-label">X-Axis</span>
            <MetricSelect
              value={options.bar.x}
              ids={AGGREGATE_BIN_METRICS}
              onChange={(x) => onBarChange({ x })}
            />
          </label>
        </div>
      )}

      {chartType === "pie" && (
        <div className="select-list">
          <label className="field">
            <span className="field-label">Portion</span>
            <MetricSelect
              value={options.pie.value}
              ids={AGGREGATE_VALUE_METRICS}
              onChange={(value) => onPieChange({ value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Cake piece</span>
            <MetricSelect
              value={options.pie.bin}
              ids={AGGREGATE_BIN_METRICS}
              onChange={(bin) => onPieChange({ bin })}
            />
          </label>
        </div>
      )}

      {chartType === "scatter" && (
        <>
          <p className="options-hint">
            Variables in the matrix (select at least two). Drag to brush a cell
            and highlight matching days everywhere.
          </p>
          <div className="checkbox-list">
            {SCATTER_METRICS.map((id) => {
              const meta = METRICS[id];
              const checked = options.scatter.columns.includes(id);
              const last = checked && options.scatter.columns.length <= 2;
              return (
                <CheckRow
                  key={id}
                  checked={checked}
                  color="var(--accent)"
                  label={meta.label}
                  disabled={last}
                  onToggle={() => onToggleScatter(id)}
                />
              );
            })}
          </div>
        </>
      )}

      {chartType === "risk" && (
        <p className="options-hint">
          Estimate the chance of catching severe influenza on a given day. Set the
          weather with the sliders on the left and read the rating on the right —
          it weighs every day in the current filters by how closely its weather
          matches yours, then scales the resulting influenza level against the
          historical range.
        </p>
      )}
    </aside>
  );
}
