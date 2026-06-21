import { ThemeToggle } from "./ThemeToggle";

export function TopLeftCard() {
  return (
    <section className="tile tile-intro">
      <h1 className="app-title">Severe influenza vs Weather</h1>
      <p className="app-desc">
        Severe acute respiratory infection (SARI) hospital admissions in Austria,
        aggregated per calendar week and compared against weekly weather. Pick a
        state on the map, brush the scatterplot to focus the line chart, and probe
        a weather scenario in the analysis tile.
      </p>
      <div className="app-footer">
        <img
          className="app-icon"
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt="Severe influenza vs Weather"
        />
        <ThemeToggle />
      </div>
    </section>
  );
}
