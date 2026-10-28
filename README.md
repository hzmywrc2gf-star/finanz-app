# Finanzklar – persönliche Haushalts-App

Kleine Web-App (PWA) für Einnahmen und Ausgaben. Läuft komplett im Browser, die Daten bleiben auf dem Gerät – kein Server, kein Login.

<p>
  <img src="docs/start.png" width="260" alt="Startseite mit Kontostand">
  <img src="docs/monat.png" width="260" alt="Monatsauswertung">
</p>

## Funktionen

- **Kontostand**: Startguthaben + Einnahmen − Ausgaben, groß auf der Startseite.
- **Buchungen**: Einnahme/Ausgabe, Betrag, Datum, Kategorie, Notiz – bearbeiten und löschen per Tippen auf die Buchung.
- **Kategorien**: Standard-Kategorien plus eigene (hinzufügen, umbenennen, löschen). Buchungen gelöschter Kategorien wandern nach „Sonstiges“.
- **Wiederkehrende Buchungen**: Miete, Abos, Gehalt (monatlich, vierteljährlich, jährlich) werden automatisch gebucht, mit optionalem Nachbuchen vergangener Termine und „Demnächst fällig“ auf der Startseite.
- **Monatsbudgets**: pro Ausgaben-Kategorie ein Budget festlegen (Tab „Budgets“), Fortschrittsbalken grün/orange/rot, Gesamtbudget, Monatsnavigation und Hinweis auf der Startseite ab 80 % Verbrauch.
- **Monatsauswertung** (Tab „Monat“): Einnahmen, Ausgaben, Saldo, Sparquote, Vergleich zum Vormonat, 6-Monats-Verlauf als Diagramm mit Tabelle, Ausgaben/Einnahmen nach Kategorie die größten Ausgaben und alle Buchungen des Monats (neueste zuerst, Tippen zum Bearbeiten, „+“ zum Hinzufügen).
- **Backup**: Export/Import aller Daten als JSON (Einstellungen → Datensicherung).
- **Offline-fähig** und als App auf dem Home-Bildschirm installierbar.

## Starten

Voraussetzung: [Node.js](https://nodejs.org) 20 oder neuer.

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Unit-Tests (Geldformat, Datum, Kontostand, Monat, Backup)
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen auf http://localhost:4173
npm run e2e        # Durchklick-Test (braucht laufendes `npm run preview` und Playwright)
```

## Online stellen (GitHub Pages, kostenlos)

1. Auf GitHub im Repository: **Settings → Pages → Source: „GitHub Actions“** wählen.
2. Jeder Push auf `main` baut und veröffentlicht die App automatisch (Workflow `.github/workflows/deploy.yml`).
3. Die Adresse lautet `https://<github-name>.github.io/finanz-app/`.

## Auf dem iPhone installieren

1. Die Adresse in **Safari** öffnen.
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → Hinzufügen.
3. Die App startet dann im Vollbild mit eigenem Icon und funktioniert auch offline.

**Wichtig:** Die Daten liegen nur im Speicher dieser App auf dem Gerät. Regelmäßig unter Einstellungen → Datensicherung exportieren (z. B. in iCloud Drive), besonders vor dem Löschen der App.

## Technik

React + Vite + TypeScript, `vite-plugin-pwa` (Manifest, Service Worker). Beträge werden intern als ganze Cent gespeichert. Der Datenzugriff ist hinter dem Interface `FinanceRepository` (`src/data/repository.ts`) gekapselt – heute `localStorage`, später austauschbar gegen IndexedDB oder eine Datenbank mit Sync. Details für Entwickler: [CLAUDE.md](CLAUDE.md).

## Nächste Ausbaustufen

1. **Sparziele** mit Zielbetrag und Datum.
2. **Sync zwischen Handy und PC** – neues Repository-Backend (z. B. Supabase oder PocketBase), Login optional.
3. Kleinere Ideen: Suche/Filter, CSV-Export, Haptik/Swipe-to-delete.
