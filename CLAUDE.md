# Projektkontext: finanz-app („Finanzklar“)

Persönliche Finanz-PWA (Deutsch, mobil zuerst, Apple-Stil). Nutzer ist kein Entwickler; Antworten auf Deutsch, kleine Schritte, alles vor „fertig“ verifizieren (Tests + `npm run e2e` + Screenshots).

## Stack
React 19 + Vite + TypeScript, vite-plugin-pwa (autoUpdate, precache), Vitest. Keine UI-/Chart-Libraries – Balken in CSS. `base: './'` für GitHub Pages (Deploy via `.github/workflows/deploy.yml`, Push auf `main`).

## Architektur
- `src/domain/` – reine Logik, ohne React: `types.ts` (AppData v5), `money.ts` (Cent ↔ „1.234,56 €“, `parseEuroInput`), `dates.ts` (lokale ISO-Daten, Monatshelfer), `calc.ts` (`accountBalance(data,'konto'|'bargeld')`, `totalBalance`, `compareTransactionsDesc`, gemeinsamer Bereichshelfer `summarizeRange`), `ledger.ts` (Buchungen + Umbuchungen gemischt, Suche, Monatsgruppen), `recurring.ts` (Terminplan, `bookDue`, `pendingConfirmations`, `upcoming` mit `excludeCategoryIds`, `monthlyEquivalent`), `month.ts` (`monthSummary` inkl. Vormonat/Sparquote/Top-5, `monthTrend`, `niceAxisMax`), `budget.ts` (`monthBudgets`, `budgetAlerts`, Status ok/warn/over per exaktem Integer-Vergleich), `defaults.ts`.
- `src/data/` – Persistenz: `repository.ts` (async Interface `load/save`), `localStorageRepo.ts` (Key `finanz-app:v1`), `backup.ts` (JSON-Export, strikte Import-Validierung), `migrate.ts` (v1→v2→v3→v4→v5, genutzt von Repo und Backup-Import). Der localStorage-Key bleibt `finanz-app:v1` (Umbenennung würde Daten verwaisen); die Version steckt im Datensatz.
- `src/state/` – `actions.ts` (pure Reducer-Funktionen inkl. `setCategoryBudget`, werfen deutsche Fehler), `FinanceContext.tsx` (`useFinance()` Hook). UI nutzt nur diesen Hook.
- `src/components/`, `src/pages/` (Start, Alle Buchungen, Bargeld, Verträge, Monat, Budgets, Einstellungen), Navigation per Tab-State (kein Router). Styles in `src/index.css` (CSS-Variablen, Dark Mode, Safe Areas).

## Regeln
- Datenmodell v5 (v4 + `RecurringRule.autoBook: boolean`, Migration v4→v5: alle bestehenden Verträge `true`; Backup validiert das Feld strikt): `Transaction.account: 'konto' | 'bargeld'` (Migration v3→v4: alles `'konto'`), `Settings.startCashCents`, `AppData.transfers` (`Transfer`: `direction` `'withdrawal'` = Abhebung Konto→Bargeld, `'deposit'` = Einzahlung Bargeld→Konto, positive Cent, Datum, optionale Notiz). Umbuchungen sind weder Einnahme noch Ausgabe: Monatsauswertung, Budgets und Kategoriesummen betrachten nur `transactions`. Bar-Buchungen zählen dort wie jede andere Buchung. Wiederkehrende Buchungen buchen immer aufs Konto. Bargeld darf negativ werden (wird rot angezeigt).
- Start-Navigation: Tab „Start“ hat genau eine Unterebene (`StartView` in `App.tsx`: Übersicht, Alle Buchungen, Bargeld, Verträge) mit iOS-Navigationsleiste (`SubPageHeader`, Zurück-Knopf `aria-label="Zurück"`). Jeder Tab-Wechsel (auch Tippen auf „Start“) setzt auf die Übersicht zurück; jede Navigation scrollt nach oben. Übersicht: Kontostand (+ „Bargeld … · Gesamt …“), Knopf „Buchung hinzufügen“ inline darunter (kein schwebender Fab auf der Startseite, er würde die letzte Zeile verdecken), Budget-Hinweis, „Demnächst fällig“, Liste mit drei Zeilen. Keine „Letzten Buchungen“ mehr.
- „Demnächst fällig“ blendet Verträge der Kategorie Gehalt (`builtInId('income','Gehalt')`) aus; andere Einnahmen bleiben. „Verträge“ ist die UI-Bezeichnung der wiederkehrenden Buchungen (Domain-Namen bleiben `recurring`); Fixkosten pro Monat = `monthlyEquivalent` (nur aktive Ausgaben-Verträge, quartalsweise ÷3, jährlich ÷12, je Regel mit `Math.round` auf ganze Cent).
- Beträge immer als positive ganze Cent (`amountCents`), Art über `kind`. Nie Floats rechnen.
- Daten als `'YYYY-MM-DD'` in lokaler Zeit, nie `toISOString()`.
- Je Art gibt es eine `builtIn`-Kategorie „Sonstiges“ (nicht löschbar/umbenennbar); gelöschte Kategorien → Buchungen nach „Sonstiges“.
- Datenmodell-Änderungen: `version` erhöhen + Migration in Repo und Backup-Import.
- Wiederkehrende Buchungen (`AppData.recurring`): `bookedThrough` = alles bis dahin ist erledigt (nur vorwärts). `bookDue` (idempotent) läuft nach dem Laden, bei `visibilitychange` und stündlich im `FinanceContext`; gelöschte erzeugte Buchungen kommen nicht zurück. Tag 29–31 → Monatsletzter. Buchungen tragen `recurringId` (darf auf gelöschte Regeln zeigen).
- Automatisch buchen (`RecurringRule.autoBook`): `bookDue` bucht nur Regeln mit `autoBook = true`; manuelle Regeln (`false`) werden komplett übersprungen, ihr `bookedThrough` rückt nicht von selbst vor. `pendingConfirmations(data, today)` liefert je manueller Regel die Termine in (bookedThrough, today] als `{rule, date}` (Datum aufsteigend, dann Titel). Actions: `confirmOccurrence` / `skipOccurrence` (nur der älteste offene Termin, sonst Fehler „Bitte zuerst den älteren Termin bestätigen.“; Buchung immer aufs Konto, mit `recurringId`, `bookedThrough` = Termin), `bookNextNow` („Jetzt buchen“: der älteste unerledigte Termin, auch in der Zukunft; Buchungsdatum frei wählbar; Fehler bei beendetem Vertrag). Wechsel auf automatisch bucht offene Termine sofort (`FinanceContext.updateRecurring` ruft danach `bookDue`); Wechsel auf manuell behält `bookedThrough`. Beim Anlegen einer manuellen Regel bedeutet „Nachbuchen“ = „Als offen anzeigen“. Start: Karte „Zu bestätigen“ direkt unter dem Kontostand (je Vertrag nur der älteste Termin + „+N weitere offene Termine“), Buttons „Buchen“ (TransactionForm im `booking`-Modus) und „Überspringen“. Vertragsliste: Hinweis „bestätigen“ bei manuellen Regeln.
- Monatsbudgets: `Category.monthlyBudgetCents` (nur Ausgaben, positive Cent, fehlt = kein Budget). Gezählt werden nur gebuchte Ausgaben des Kalendermonats (keine geplanten). Schwellen: ab 80 % warn, über 100 % over. Start zeigt Hinweiskarte bei warn/over.
- Neues Backend: neue Klasse, die `FinanceRepository` implementiert; UI bleibt unverändert.

- Monatsauswertung (`MonthPage`): nur gebuchte Buchungen des Kalendermonats, Vergleich zum Vormonat (mehr Einnahmen/Saldo = gut, mehr Ausgaben = schlecht), Verlaufsdiagramm in CSS (Einnahmen links, Ausgaben rechts, gemeinsame Achse ab 0) mit Tabelle als Nicht-Farb-Fallback. Ganz unten „Alle Buchungen“ des Monats (neueste zuerst, `monthSummary.transactions`, Tippen öffnet das Bearbeiten-Sheet) und „+“ (Fab; Datum = heute im aktuellen Monat, sonst der 1. des angezeigten Monats). Es gibt keine Wochenansicht mehr. Kein Datenmodell-Update nötig.

## Projektgraph (Graphify)
- `graphify-out/GRAPH_REPORT.md` (Überblick: Kern-Abstraktionen, Module, Zusammenhänge) und `graphify-out/graph.json` (vollständiger Code-Graph) liegen im Repo. Neue Chats: zuerst den Report lesen statt alle Dateien zu öffnen; gezielt abfragen mit `graphify query "<Frage>"`, `graphify explain "<Symbol>"`, `graphify path "A" "B"`.
- Installation (falls nicht vorhanden): `uv tool install graphifyy` oder `pip install graphifyy` (Quelle: github.com/Graphify-Labs/graphify).
- Nach Code-Änderungen vor dem Commit aktualisieren – offline, ohne KI-Dienst: `GRAPHIFY_BACKEND=none graphify update .`

## Prüfen
`npm test` · `npm run build` · `npm run preview` + `npm run e2e` (Playwright, 71 Durchklick-Prüfungen inkl. Offline, Verträge, Budgets, Monatsauswertung, Start-Übersicht, Alle Buchungen mit Suche, Bargeld/Umbuchungen, manuelle Verträge (Bestätigen/Überspringen/Jetzt buchen), Migration v3→v4 und v4→v5 und Datumswechsel per `page.clock`).

## Backlog (nicht in v1)
- Investitionen, Depot-Übersicht: Positionen manuell (Name/ISIN, Stückzahl, Kaufkurs), Kurs manuell nachtragen, Wert + Gewinn/Verlust; offline, keine Kurs-APIs (CORS, inoffizielle Quellen).
- Investitionen, Sparpläne: Vertrag Konto → Depot, zählt wie eine Umbuchung nicht als Ausgabe.
- Sparziele, Sync Handy/PC.
- Bewusst nicht: das Day-Trader-Skill-Paket (github.com/Jakeschincariol/day-trader-skill) – US-Day-Trading, Python/Chat-basiert, passt nicht in die Offline-PWA.
