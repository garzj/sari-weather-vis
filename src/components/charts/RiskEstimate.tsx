import type { WeekRecord } from "../../data/load";
import type { MetricId } from "../../data/metrics";
import {
  estimateEmpiricalRisk,
  type EmpiricalRisk,
} from "../../data/riskEstimate";

const LABELS: Record<EmpiricalRisk, string> = {
  "too-little": "Too little data",
  low: "Low empirical risk",
  increased: "Increased risk",
};

function GaugeIcon() {
  return (
    <svg
      className="risk-gauge-icon"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
    >
      <path
        d="M4 14a8 8 0 1 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
      <path
        d="M12 14 L15.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Props {
  records: WeekRecord[];
  enabled: MetricId[];
}

export function RiskEstimate({ records, enabled }: Props) {
  const level = estimateEmpiricalRisk(records, enabled);

  return (
    <div className={`risk-estimate risk-estimate--${level}`}>
      <GaugeIcon />
      <span>{LABELS[level]}</span>
    </div>
  );
}
