# Severe Influenza vs Weather

An interactive visual storytelling app exploring how weather conditions in Austria
relate to severe acute respiratory infection (SARI) hospital admissions — with a
focus on severe influenza. Built with **React + TypeScript + Vite** and **D3.js**.

This is the implementation for Assignment 3 (building on the Assignment 2 proposal).

## Layout

- **Left sidebar** — project title, description, and global filters:
  - **State** selector (defaults to Vienna, includes an "All states" aggregate).
  - **Time window** (defaults to the full available range, 19th calendar week
    2023 – 22nd calendar week 2026). Filters update every view live.
  - A theme toggle and the app icon sit at the bottom.
- **Center tabs** — switch views by clicking a tab or pressing the ← / → keys:
  - **Infection risk** — set today's temperature, downfall, and wind speed with
    sliders (or fetch them for the selected state from the Open-Meteo API) and
    read an estimated chance of severe influenza on a gauge. Controls are on the
    left, the gauge on the right.
  - **Line graph** — daily series over time (each line min-max normalized so
    differently-scaled metrics share one axis). Hover a line to see its name and
    the value at that point.
  - **Aggregates** — bar chart of the average per-day value of a SARI metric,
    grouped by a binned weather variable.
  - **Pie chart** — same aggregation shown as relative slices.
  - **Scatterplot** — a brushable scatterplot matrix (SPLOM) of the selected
    variables, with points colored by season. Drag to brush any cell and the
    matching days are highlighted across every other cell (brushing & linking).
    Adapted from [Mike Bostock's brushable scatterplot matrix](https://observablehq.com/@d3/brushable-scatterplot-matrix).
- **Right sidebar** — options for the current view:
  - Line graph: colored checkboxes, one per series (color matches the line).
  - Bar / Pie: selectable Y-axis (value metric) and X-axis (binned metric). For
    the pie chart these are labeled **Portion** and **Cake piece**.
  - Scatterplot: checkboxes to choose which variables form the matrix.
  - Infection risk: a short description of how the estimate works.

Light and dark themes are supported (toggle persists in `localStorage`). On
narrow screens the layout stacks into a single column and the tabs collapse into
a compact ‹ title › switcher.

## Data

The CSV datasets live in `public/data/` and are fetched and parsed in the browser
with D3 (`d3-dsv`):

- `sari-data.csv` — weekly SARI hospital admissions per federal state
  (source: [sari-dashboard.at](https://www.sari-dashboard.at/opendata)).
- `weather-data.csv` — daily historical weather per location
  (source: [open-meteo.com historical weather API](https://open-meteo.com/en/docs/historical-weather-api)).
- `weather-locations.csv` — maps weather `location_id` to a federal state.

Weekly SARI counts are matched to each day via ISO calendar week and exposed as a
per-day average (weekly count ÷ 7), so they can be combined with the daily weather
metrics. The Infection risk tab additionally fetches today's forecast live from
the [Open-Meteo forecast API](https://open-meteo.com/en/docs).

## Getting started

Requirements: Node.js 20+ and [Yarn](https://yarnpkg.com/) 1.x.

```bash
yarn install   # install dependencies
yarn dev       # start the dev server (http://localhost:5173)
yarn build     # type-check and build for production (output in dist/)
yarn preview   # preview the production build
yarn lint      # run eslint
```

## Deployment

Vite is configured with `base: './'`, so the production build (`dist/`) uses
relative asset paths and runs from the origin root **or** any subpath
(e.g. `https://example.com/gv-app/`) without rebuilding — just drop `dist/` at
the desired location and serve it statically. The CSV datasets are fetched
relative to the page, so they are served from `<deploy-path>/data/`.

## Project structure

```
src/
  data/
    metrics.ts     # metric registry (labels, units, colors, bin sizes)
    load.ts        # CSV fetching, ISO-week join, daily merged records
    aggregate.ts   # binning + all-states merge helpers
    risk.ts        # risk model and Open-Meteo fetch
  hooks/           # data loading + responsive sizing hooks
  components/
    LeftSidebar.tsx
    RightSidebar.tsx
    Tabs.tsx
    ThemeToggle.tsx
    charts/        # LineChart, BarChart, PieChart, ScatterPlot, RiskMeter
  appTypes.ts      # tab list and option types
  App.tsx          # state + wiring
```
