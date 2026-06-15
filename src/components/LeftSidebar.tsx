import { STATES, ALL_STATES } from "../data/metrics";
import { toDateInput, fromDateInput } from "../utils/date";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  state: string;
  onStateChange: (s: string) => void;
  from: Date;
  to: Date;
  onFromChange: (d: Date) => void;
  onToChange: (d: Date) => void;
  minDate: Date;
  maxDate: Date;
}

export function LeftSidebar({
  state,
  onStateChange,
  from,
  to,
  onFromChange,
  onToChange,
  minDate,
  maxDate,
}: Props) {
  return (
    <aside className="sidebar sidebar-left">
      <h1 className="app-title">Severe influenza vs Weather</h1>
      <p className="app-desc">
        Severe acute respiratory infection (SARI) hospital admissions in Austria
        compared against historical daily weather data. Adjust the filters and
        options to explore how weather conditions relate to severe influenza and
        other infections.
      </p>

      <div className="filters">
        <label className="field">
          <span className="field-label">State</span>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
          >
            <option value={ALL_STATES}>All states</option>
            {STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span className="field-label">Time window</span>
          <div className="date-row">
            <input
              type="date"
              value={toDateInput(from)}
              min={toDateInput(minDate)}
              max={toDateInput(to)}
              onChange={(e) => onFromChange(fromDateInput(e.target.value))}
            />
            <span className="date-sep">–</span>
            <input
              type="date"
              value={toDateInput(to)}
              min={toDateInput(from)}
              max={toDateInput(maxDate)}
              onChange={(e) => onToChange(fromDateInput(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="app-footer">
        <img
          className="app-icon"
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt="Severe influenza vs Weather"
        />
        <ThemeToggle />
      </div>
    </aside>
  );
}
