import { toDateInput, fromDateInput } from "../utils/date";

interface Props {
  from: Date;
  to: Date;
  minDate: Date;
  maxDate: Date;
  onFromChange: (d: Date) => void;
  onToChange: (d: Date) => void;
}

// mock data files shown as if they were uploaded; the app keeps using the
// bundled csvs under public/data.
const MOCK_FILES = [
  { name: "sari-data.csv", note: "hospital admissions, weekly" },
  { name: "weather-data.csv", note: "daily weather, 9 stations" },
];

export function UploadCard({
  from,
  to,
  minDate,
  maxDate,
  onFromChange,
  onToChange,
}: Props) {
  return (
    <section className="tile tile-upload">
      <h2 className="tile-title">Data &amp; time range</h2>

      <div className="upload-drop">
        <span className="upload-hint">Drop CSV files here</span>
        <button type="button" className="upload-btn" disabled>
          Browse files
        </button>
      </div>

      <ul className="upload-files">
        {MOCK_FILES.map((f) => (
          <li key={f.name} className="upload-file">
            <span className="upload-file-name">{f.name}</span>
            <span className="upload-file-note">{f.note}</span>
          </li>
        ))}
      </ul>

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
    </section>
  );
}
