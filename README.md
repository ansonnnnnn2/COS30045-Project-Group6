# VisiRoad merged dataset website

Open `dvp/index.html` with VS Code Live Server. Keep the complete `dvp` folder together.

## One dataset and one dashboard

The site reads only `dvp/data/FinalG6.csv`, copied unchanged from the uploaded merged KNIME export: 85,397 records and 12 columns. There is no Dataset selector.

- Dashboard: national recorded-case KPIs, annual trend and 2020 monthly comparison.
- Age & Road User Groups: national age and road-user comparisons.
- Regional Map: national remoteness map alongside state/territory total bars, sourced from the state records in that same file.
- Year applies to state totals. Other filters apply to the national views; the state panel explicitly says Year filter only because state marginals cannot support joint age/sex/road-user filtering.
- Theme, reset, notes and three-view navigation remain available.
- Main Export CSV exports the national selection. Export state totals in the state panel exports only state total rows for the selected Year.

## Measures and interpretation

All charts use **Count of cases**. The unfiltered national headline is 413,013 cases, compared with the old 410,884 Hospitalisations measure. They are different measures.

National and state records describe overlapping populations. They are presented as separate comparisons, never summed into a combined headline. State totals across 2011–2021 sum to 403,293 and may differ from the national series. State overview calculations select only rows whose Age group, Sex, Road user and Counterparty are All, preventing repeated counting of demographic marginals.

The supplied upstream workflow converted suppressed n.p. values to zero, so the CSV cannot distinguish those substitutions from measured zeroes. Original suppressed cells should not be interpreted as known absences. No state marginal breakdowns are added to the published total rows.

The map displays patients' usual-residence remoteness categories, not crash locations. Each polygon uses its category's nationwide total, not a separately measured local count. Boundaries are ABS 2021; tiles are OpenStreetMap. State bars are not added to these remoteness totals.

## Verification

Run `node tests/data-model.test.cjs`. Checks cover source isolation, state-total vs marginal selection, exact annual/state/period totals, chart-context filtering and invalid-value handling. JavaScript syntax, local asset references and unchanged CSV bytes were checked. Interactive browser/visual verification has not been completed in this environment.

## Install

Back up your current project. Replace its `dvp` folder with this package's `dvp` folder, then use Live Server. Read the data notes before updating the design book: this version uses Count of cases and a single merged export. Nothing in this package pushes changes to GitHub.

## Assistance

GenAI assisted the merged-data adapter, dataset integration, charts, interface changes and checks. Team review of the implementation, source interpretation and accessibility is still required.
