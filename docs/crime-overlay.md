# Crime overlay snapshot

The map uses hardcoded official offence totals, not invented safety scores.

## London: calendar year 2025

- Publisher: Metropolitan Police Service via London Datastore.
- Dataset: https://data.london.gov.uk/dataset/mps-recorded-crime-geographic-breakdown-exy3m
- Download: https://data.london.gov.uk/download/exy3m/pf6/MPS%20Borough%20Level%20Crime%20(most%20recent%2024%20months).csv
- Retrieved 11 September 2026; source window September 2024–August 2026.
- Sum columns `202501` through `202512` for every Group/SubGroup row, grouped by `BOCU`.
- Display the 32 named boroughs. Exclude Unknown and Aviation Policing. City of London has a separate police force and is not represented.

## Tokyo: calendar year 2024 (Reiwa 6)

- Publisher: Tokyo Metropolitan Police Department.
- Dataset: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html
- Download: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.files/R6.csv
- Retrieved 11 September 2026; CSV encoding CP932.
- Use `総合計` from exact ward-name rows (e.g. `新宿区`). Do not add neighborhood rows or `区計` subtotals: that would triple-count offences.
- The 23 ward totals sum to 70,081, matching the source’s 23-ward total. Other Tokyo municipalities are outside this overlay.

## Interpretation and rendering

Totals are ranked separately in each city into lower, middle and higher thirds. No population or visitor denominator is available in this snapshot. Totals are not rates, personal risk estimates, current conditions or comparable measures across countries/years. Reporting practices and offence definitions differ.

Manually placed approximate area centers feed a continuous raster surface. Gaussian-weighted interpolation blends within-city percentile ranks before applying a green–amber–red gradient. Bandwidth is 1.25 times the display radius (London 2.4 km; Tokyo 1.8 km). A blurred convex-hull mask feathers the outer edge; the interior has no circular alpha patches. This is illustrative interpolation, not police boundaries or inferred incident locations. Unshaded space does not mean safe or zero crime.

Uses a Web Mercator canvas image in Google Maps GroundOverlay, cached per city. The GroundOverlay receives clicks and opens the nearest representative area. Toggle cleanup removes the surface, listener and popups. The snapshot is bundled locally; no crime-service requests are made at runtime.
