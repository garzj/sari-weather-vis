# Severe Influenza vs Weather

An interactive dashboard exploring how weather conditions in Austria relate to
severe acute respiratory infection (SARI) hospital admissions — with a focus on
severe influenza. Built with **React + TypeScript + Vite** and **D3.js**.

This is the implementation for Assignment 3 (building on the Assignment 2 proposal).

## Layout

The dashboard uses a fixed grid (stacks on narrow screens):

| Area | Tile |
|------|------|
| Top-left | **Intro** — title, short description, theme toggle |
| Top-center | **Austria map** — click a state to filter; date range and age-group controls |
| Top-right | **Week's weather** — temperature/humidity sliders and tolerances |
| Bottom-left | **Line graph options** — toggle infection and weather series |
| Bottom-center | **Line graph** — weekly time series with empirical risk label |
| Bottom-right | **Scatterplot (SPLOM)** — brushable matrix linking weather to cases |

Light and dark themes are supported (toggle persists in `localStorage`).

## How the views connect

### Global filters (map tile)

- **State** — click a federal state on the map; click again to clear. All states
  are shown when none is selected.
- **Date range** — two date inputs limit the weeks shown everywhere.
- **Age group** — dropdown (all ages, 60+, 80+). SARI counts are converted to
  **ppm** (cases per million population) using age-specific population tables.

Changing any global filter clears the scatterplot brush and line-chart selection.

### Line graph

- Toggle **Covid**, **Severe influenza**, and **All infections** plus weather
  metrics (temperature, humidity, VPD, etc.). At least **one infection type**
  must stay enabled.
- SARI metrics share a dedicated ppm axis; weather metrics are min–max normalized
  on a second axis so differently scaled series can be compared.
- A red reference line marks **30 ppm infection cases**.
- **Without a brush:** shows all weeks matching the global filters.
- **With a brush:** title switches to “brushed weeks” and only the selected weeks
  are plotted. An empty brush shows “No data selected.”

### Week's weather → scatterplot brush

Weather controls drive the scatterplot filter **one way**:

1. On load, the app fetches the **current week's mean temperature and humidity**
   (Open-Meteo) and sets the sliders.
2. Moving any slider (temperature, humidity, or ± tolerances) **live-updates** a
   brush on the temperature × humidity cell in the SPLOM.
3. Weeks inside that rectangle are highlighted and fed to the line graph.

The weather tile is always the source of truth for this brush. It is never
updated from the scatterplot.

### Manual scatterplot brush

You can also drag a brush on **any** SPLOM cell to explore other metric pairs.
That temporarily overrides the weather-driven filter for the line graph.

- **Apply** (appears on the Week's weather tile after a manual brush) — discards
  the manual override and restores the brush from the current weather sliders.
  Does **not** change the weather selection.
- **Clear** (appears on the scatterplot title while a brush is active) — removes
  the brush and clears the line-chart week filter.

Moving a weather slider also clears a manual scatterplot override.

### Empirical risk label

When a brush filter is active, a gauge icon and label appear beside the line
graph title. The estimate uses only the **enabled infection types** in the line
graph options:

| Condition | Label |
|-----------|-------|
| ≤ 10 brushed weeks | Too little data |
| > 10 weeks and ≥ 5 weeks ≥ 30 ppm (any enabled type) | Increased risk |
| > 10 weeks otherwise | Low empirical risk |

## Data

CSV datasets live in `public/data/` and are fetched in the browser with D3
(`d3-dsv`):

- `sari-data.csv` — weekly SARI hospital admissions per federal state and age
  band ([sari-dashboard.at](https://www.sari-dashboard.at/opendata)).
- `weather-data.csv` — weekly aggregated weather per location
  ([Open-Meteo historical weather API](https://open-meteo.com/en/docs/historical-weather-api)).
- `weather-locations.csv` — maps weather `location_id` to a federal state.
- `population.csv` — state population by age group for ppm conversion.

SARI and weather records are joined by ISO calendar week. The **Current week**
button fetches live mean temperature and humidity for the last seven days from
the [Open-Meteo forecast API](https://open-meteo.com/en/docs).

State boundaries come from `public/geo/austria-states.geojson`.

## Getting started

Requirements: Node.js 20+ and [Yarn](https://yarnpkg.com/) 1.x.

```bash
yarn install   # install dependencies
yarn dev       # start the dev server (http://localhost:5173)
yarn build     # type-check and build for production (output in dist/)
yarn preview   # preview the production build
yarn lint      # run eslint
```

## Demo script

1. Open the app — note the weather brush on the SPLOM temp × humidity cell and
   the matching weeks in the line graph.
2. Click **Wien** on the map; the scatterplot and line chart narrow to Vienna.
3. Drag the **Temperature** slider — watch the brush and line graph update live.
4. Brush a different SPLOM cell (e.g. VPD vs sunshine) — the line graph follows
   your custom selection; **Apply** restores the weather-driven brush without
   moving the sliders.
5. Enable **Covid cases** in the line options and check how the risk label reacts
   to the brushed weeks.
6. Toggle age group to **60+** and compare ppm levels against the 30 ppm line.

## Deployment

Vite is configured with `base: './'`, so the production build (`dist/`) uses
relative asset paths and runs from the origin root **or** any subpath
(e.g. `https://example.com/gv-app/`) without rebuilding — drop `dist/` at the
desired location and serve it statically. CSV and GeoJSON files are fetched
relative to the page, so they are served from `<deploy-path>/data/` and
`<deploy-path>/geo/`.

## Project structure

```
src/
  data/
    metrics.ts       # metric registry (labels, units, colors, scale groups)
    load.ts          # CSV fetching, ISO-week join, age-aware records
    aggregate.ts     # weekly merge helpers (all-states / brushed selection)
    brushWeather.ts  # weather sliders ↔ SPLOM brush conversion
    riskEstimate.ts  # empirical risk from brushed weeks + enabled SARI metrics
    risk.ts          # Open-Meteo fetch for current-week weather
    age.ts           # age groups and ppm conversion
    population.ts    # population table parsing
  hooks/             # dataset loading + responsive sizing
  components/
    TopLeftCard.tsx
    OptionsCard.tsx
    ThemeToggle.tsx
    charts/
      AustriaMap.tsx
      LineChart.tsx
      ScatterPlot.tsx
      WeatherAnalysis.tsx
      RiskEstimate.tsx
  appTypes.ts        # chart option types and defaults
  App.tsx            # state, brush sync, and tile wiring
```
