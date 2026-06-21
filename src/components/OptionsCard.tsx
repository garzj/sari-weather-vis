import { motion } from "framer-motion";
import { LINE_METRICS, METRICS, type MetricId } from "../data/metrics";

interface Props {
  enabled: MetricId[];
  onToggle: (id: MetricId) => void;
}

function CheckRow({
  checked,
  color,
  label,
  onToggle,
}: {
  checked: boolean;
  color: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={onToggle} />
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
  return (
    <section className="tile tile-options">
      <h2 className="options-title">Line graph</h2>
      <div className="checkbox-list">
        {LINE_METRICS.map((id) => {
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
