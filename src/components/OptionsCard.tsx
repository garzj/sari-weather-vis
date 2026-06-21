import { motion } from "framer-motion";
import {
  METRICS,
  SARI_METRICS,
  WEATHER_METRICS,
  type MetricId,
} from "../data/metrics";

interface Props {
  enabled: MetricId[];
  onToggle: (id: MetricId) => void;
}

function CheckRow({
  checked,
  color,
  label,
  disabled = false,
  onToggle,
}: {
  checked: boolean;
  color: string;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={`checkbox-row${disabled ? " checkbox-row--disabled" : ""}`}>
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

export function OptionsCard({ enabled, onToggle }: Props) {
  const enabledSari = SARI_METRICS.filter((id) => enabled.includes(id));

  return (
    <section className="tile tile-options">
      <h2 className="options-title">Line graph</h2>
      <div className="checkbox-list">
        {SARI_METRICS.map((id) => {
          const meta = METRICS[id];
          const checked = enabled.includes(id);
          const locked = checked && enabledSari.length === 1;
          return (
            <CheckRow
              key={id}
              checked={checked}
              color={meta.color}
              label={meta.label}
              disabled={locked}
              onToggle={() => onToggle(id)}
            />
          );
        })}
        <div className="options-divider" role="separator" />
        {WEATHER_METRICS.map((id) => {
          const meta = METRICS[id];
          return (
            <CheckRow
              key={id}
              checked={enabled.includes(id)}
              color={meta.color}
              label={meta.label}
              onToggle={() => onToggle(id)}
            />
          );
        })}
      </div>
    </section>
  );
}
