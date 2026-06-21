import { ThemeToggle } from './ThemeToggle';

export function TopLeftCard() {
  return (
    <section className='tile tile-intro'>
      <h1 className='app-title'>Severe influenza vs Weather</h1>
      <p className='app-desc'>
        Weekly SARI hospital admissions in Austria (ppm), matched to weather by
        calendar week. Filter by state, date range, and age group on the map.
        The Week&apos;s weather sliders update a brush on the scatterplot; drag
        any cell to explore other metric pairs. The line graph shows the brushed
        weeks and an empirical risk estimate for your selected infection types.
      </p>
      <div className='app-footer'>
        <img
          className='app-icon'
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt='Severe influenza vs Weather'
        />
        <ThemeToggle />
      </div>
    </section>
  );
}
