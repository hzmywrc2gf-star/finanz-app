# Projektkontext: finanz-app

Persönliche Finanz-PWA (Deutsch, mobil zuerst, Apple-Stil). Nutzer ist kein Entwickler; Antworten auf Deutsch, kleine Schritte, alles vor „fertig“ verifizieren (Tests + `npm run e2e` + Screenshots).

## Stack
React 19 + Vite + TypeScript, vite-plugin-pwa (autoUpdate, precache), Vitest. Keine UI-/Chart-Libraries – Balken in CSS. `base: './'` für GitHub Pages (Deploy via `.github/workflows/deploy.yml`, Push auf `main`).

## Architektur
- `src/domain/` – reine Logik, ohne React: `types.ts` (AppData v1), `money.ts` (Cent ↔ „1.234,56 €“, `parseEuroInput`), `dates.ts` (lokale ISO-Daten, Mo-Wochenstart, ISO-KW), `calc.ts` (`currentBalance`, `weekSummary`), `defaults.ts`.
- `src/data/` – Persistenz: `repository.ts` (async Interface `load/save`), `localStorageRepo.ts` (Key `finanz-app:v1`), `backup.ts` (JSON-Export, strikte Import-Validierung).
- `src/state/` – `actions.ts` (pure Reducer-Funktionen, werfen deutsche Fehler), `FinanceContext.tsx` (`useFinance()` Hook). UI nutzt nur diesen Hook.
- `src/components/`, `src/pages/` (Start, Woche, Einstellungen), Navigation per Tab-State (kein Router). Styles in `src/index.css` (CSS-Variablen, Dark Mode, Safe Areas).

## Regeln
- Beträge immer als positive ganze Cent (`amountCents`), Art über `kind`. Nie Floats rechnen.
- Daten als `'YYYY-MM-DD'` in lokaler Zeit, nie `toISOString()`.
- Je Art gibt es eine `builtIn`-Kategorie „Sonstiges“ (nicht löschbar/umbenennbar); gelöschte Kategorien → Buchungen nach „Sonstiges“.
- Datenmodell-Änderungen: `version` erhöhen + Migration in Repo und Backup-Import.
- Neues Backend: neue Klasse, die `FinanceRepository` implementiert; UI bleibt unverändert.

## Prüfen
`npm test` · `npm run build` · `npm run preview` + `npm run e2e` (Playwright, 15 Durchklick-Prüfungen inkl. Offline).

## Backlog (nicht in v1)
Wiederkehrende Fixkosten, Budgets pro Kategorie, Monatsauswertung, Sparziele, Sync Handy/PC.
