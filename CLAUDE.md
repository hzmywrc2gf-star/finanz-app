# Projektkontext: finanz-app („Finanzklar“)

Persönliche Finanz-PWA (Deutsch, mobil zuerst, Apple-Stil). Nutzer ist kein Entwickler; Antworten auf Deutsch, kleine Schritte, alles vor „fertig“ verifizieren (Tests + `npm run e2e` + Screenshots).

## Stack
React 19 + Vite + TypeScript, vite-plugin-pwa (autoUpdate, precache), Vitest. Keine UI-/Chart-Libraries – Balken in CSS. `base: './'` für GitHub Pages (Deploy via `.github/workflows/deploy.yml`, Push auf `main`).

## Architektur
- `src/domain/` – reine Logik, ohne React: `types.ts` (AppData v3), `money.ts` (Cent ↔ „1.234,56 €“, `parseEuroInput`), `dates.ts` (lokale ISO-Daten, Mo-Wochenstart, ISO-KW), `calc.ts` (`currentBalance`, `weekSummary`, gemeinsamer Bereichshelfer `summarizeRange`), `recurring.ts` (Terminplan, `bookDue`, `upcoming`), `month.ts` (`monthSummary` inkl. Vormonat/Sparquote/Top-5, `monthTrend`, `niceAxisMax`), `budget.ts` (`monthBudgets`, `budgetAlerts`, Status ok/warn/over per exaktem Integer-Vergleich), `defaults.ts`.
- `src/data/` – Persistenz: `repository.ts` (async Interface `load/save`), `localStorageRepo.ts` (Key `finanz-app:v1`), `backup.ts` (JSON-Export, strikte Import-Validierung), `migrate.ts` (v1→v2→v3, genutzt von Repo und Backup-Import). Der localStorage-Key bleibt `finanz-app:v1` (Umbenennung würde Daten verwaisen); die Version steckt im Datensatz.
- `src/state/` – `actions.ts` (pure Reducer-Funktionen inkl. `setCategoryBudget`, werfen deutsche Fehler), `FinanceContext.tsx` (`useFinance()` Hook). UI nutzt nur diesen Hook.
- `src/components/`, `src/pages/` (Start, Woche, Monat, Budgets, Einstellungen), Navigation per Tab-State (kein Router). Styles in `src/index.css` (CSS-Variablen, Dark Mode, Safe Areas).

## Regeln
- Beträge immer als positive ganze Cent (`amountCents`), Art über `kind`. Nie Floats rechnen.
- Daten als `'YYYY-MM-DD'` in lokaler Zeit, nie `toISOString()`.
- Je Art gibt es eine `builtIn`-Kategorie „Sonstiges“ (nicht löschbar/umbenennbar); gelöschte Kategorien → Buchungen nach „Sonstiges“.
- Datenmodell-Änderungen: `version` erhöhen + Migration in Repo und Backup-Import.
- Wiederkehrende Buchungen (`AppData.recurring`): `bookedThrough` = alles bis dahin ist erledigt (nur vorwärts). `bookDue` (idempotent) läuft nach dem Laden, bei `visibilitychange` und stündlich im `FinanceContext`; gelöschte erzeugte Buchungen kommen nicht zurück. Tag 29–31 → Monatsletzter. Buchungen tragen `recurringId` (darf auf gelöschte Regeln zeigen).
- Monatsbudgets: `Category.monthlyBudgetCents` (nur Ausgaben, positive Cent, fehlt = kein Budget). Gezählt werden nur gebuchte Ausgaben des Kalendermonats (keine geplanten). Schwellen: ab 80 % warn, über 100 % over. Start zeigt Hinweiskarte bei warn/over.
- Neues Backend: neue Klasse, die `FinanceRepository` implementiert; UI bleibt unverändert.

- Monatsauswertung (`MonthPage`): nur gebuchte Buchungen des Kalendermonats, Vergleich zum Vormonat (mehr Einnahmen/Saldo = gut, mehr Ausgaben = schlecht), Verlaufsdiagramm in CSS (Einnahmen links, Ausgaben rechts, gemeinsame Achse ab 0) mit Tabelle als Nicht-Farb-Fallback. Kein Datenmodell-Update nötig.

## Prüfen
`npm test` · `npm run build` · `npm run preview` + `npm run e2e` (Playwright, 44 Durchklick-Prüfungen inkl. Offline, wiederkehrende Buchungen, Budgets, Monatsauswertung und Datumswechsel per `page.clock`).

## Backlog (nicht in v1)
Sparziele, Sync Handy/PC.
