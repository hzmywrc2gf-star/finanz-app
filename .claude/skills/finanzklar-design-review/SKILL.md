---
name: finanzklar-design-review
description: Design-Prüfung für Finanzklar (iPhone-Web-App im Apple-Stil) – Gegencheck auf typische KI-Design-Fehler und Kritik-Runden anhand von Screenshots mit festem Bewertungsraster. Nur nutzen bei Design-/Gestaltungsarbeit (neue Oberflächen, Umbau von Layout, Farben, Verläufen, Animationen), nicht bei reiner Logik.
---

# Finanzklar – Design-Prüfung

Angepasst aus taste-skill (`vendor/tells.md`, `vendor/critique.md`, MIT, siehe `vendor/NOTICE.md`).
Die Originale sind für Marketing-Websites geschrieben; hier gilt die Fassung unten. Maßstab ist eine
**iPhone-App im Apple-Stil** mit dem Design-Ziel aus `CLAUDE.md` (Haptik, Feder-Animationen,
schöne Farbverläufe). Bewertet wird immer an **Screenshots, nie am Code**.

## 1. Gegencheck: typische KI-Design-Fehler („Tells“)

Ein „Tell“ ist ein Gestaltungsmittel, das nach Vorlage aussieht, weil es ohne Grund überall auftaucht.

### Nicht verwenden
| Tell | Stattdessen |
|---|---|
| Violett-/Indigo-Verlauf als Standardlook, Leuchten (Glow) um Buttons oder Karten | Verläufe aus der App-Palette (Blau/Grün/Rot der App, Ton-in-Ton), ohne Glow |
| Verlauf in Text (Gradient-Schrift) | Volle Textfarbe |
| Weicher grauer Schatten unter jeder Karte | Tonstufe zum Hintergrund (wie jetzt); Schatten nur für schwebende Elemente (Sheet, Fab, Toast) |
| Emoji als Symbole oder Aufzählungszeichen | Eigene SVG-Symbole bzw. Wörter |
| Dekoratives Leuchten/Pulsieren („live“-Punkt), Endlos-Animationen ohne Bedeutung | Weglassen |
| Gleiches Ein-/Ausblenden auf jedem Block, versetzte Einflug-Animationen beim Laden | Bewegung nur als Antwort auf Handlung (Tippen, Wischen, Navigation) |
| Hover-Hochheben jeder Karte | Tippfeedback (`data-pressed`) |
| Erfundene Zahlen, Platzhalter, Lorem, Fake-Diagramme aus grauen Balken | Echte Werte aus den Daten; leere Zustände mit klarem Text |
| Werbesprache: „nahtlos“, „mühelos“, „revolutionär“, „Jetzt starten“, „Mehr erfahren“ | Knöpfe nach ihrer Handlung benennen („Buchung hinzufügen“, „Sichern“) |
| Neun fast gleiche Schriftgrößen | Wenige, deutlich verschiedene Größen (iOS: Large Title, Title, Body, Footnote) |
| Alles zentriert | Linksbündig wie iOS-Listen; zentriert nur für Einzelmomente (Begrüßung, Sperrbildschirm) |

### Bewusst erlaubt (iOS-Konvention bzw. Nutzerwunsch – keine Tells hier)
- **Farbige Symbol-Kacheln** in Listen (wie iPhone-Einstellungen).
- **Kleine Abschnittstitel in Großbuchstaben** über gruppierten Listen (iOS „grouped inset“).
- **Gleicher Eckenradius** auf Karten (iOS-Stil), runde Knöpfe.
- **Farbverläufe** (Design-Ziel) – aber gezielt: an wenigen Stellen mit Bedeutung (z. B. Kontostand-Karte, Kopfbereich, Budget-Balken), ruhig, Ton-in-Ton; Text darauf muss Kontrast ≥ 4,5:1 in Hell UND Dunkel haben.
- **Feder-Animation mit leichtem Nachschwingen** (Design-Ziel) – nur beim Loslassen einer Geste bzw. bei Navigation, dezent; nie Dauer-Bounce, nie bei „Bewegung reduzieren“.
- **Glas-/Unschärfe-Effekt** (Liquid Glass) sparsam für Leisten (Tab-Leiste, Navigationsleiste), nicht für jede Karte; Performance mit `e2e/perf.mjs` prüfen.

### Warum Weglassen nicht reicht
Eine Oberfläche ohne Tells, aber ohne eigene Idee, wirkt leer. Erst die Idee (was soll man hier auf einen
Blick sehen?), dann die Gestaltung, erst dann der Gegencheck.

## 2. Kritik-Runde an Screenshots

**Screenshots:** iPhone SE (375 px), iPhone 13 (390 px), iPhone Pro Max (430 px) – jeweils **Hell und Dunkel**;
bei Animationen zusätzlich ein Bild mitten in der Bewegung; einmal mit „Bewegung reduzieren“.

**Durchgänge** (jeden für sich, nicht vermischen):
1. **Eine Sekunde, dann fünf:** Was sieht man zuerst? Es sollte genau eine Antwort geben (z. B. der Kontostand). Nach fünf Sekunden: Ist klar, was man hier tun kann?
2. **Blinzeln:** Zerfällt der Bildschirm in zwei, drei klare Massen mit deutlichem Größenunterschied – oder in viele gleich große?
3. **Kanten:** Wie viele verschiedene linke Textkanten? Zwei bis drei, bewusst wiederverwendet.
4. **Abstände und Rahmen:** Zusammengehöriges nah, Getrenntes fern; Abstand zwischen Abschnitten deutlich größer als innerhalb; gleiche Ränder links/rechts; keine zufälligen Löcher.
5. **Schrift:** Klarer Sprung Fließtext → Titel; höchstens fünf Größen; keine Waisen-Wörter in Titeln; Beträge mit tabellarischen Ziffern.
6. **Farbe:** Welche Farbe trägt die Fläche, welche stützt, wo ist der Akzent? Akzent an zu vielen Stellen bedeutet nichts. Grün/Rot nur für Einnahme/Ausgabe bzw. gut/schlecht. Verläufe: wirken sie edel oder nach Vorlage?
7. **Bewegung:** Antwortet jede Bewegung auf eine Handlung? Folgt sie dem Finger, ohne Ruck? Nachschwingen dezent? Bei „Bewegung reduzieren“ nur Überblenden?
8. **Bedienbarkeit am Telefon:** Tippflächen ≥ 44 px; nichts unter der Tab-Leiste, dem „+“ oder der Notch verdeckt; nichts läuft seitlich aus dem Bild; Daumenreichweite der Hauptaktion.
9. **Inhalt stimmt:** Stimmen die gezeigten Zahlen mit den Daten (nachrechnen)? Leere Zustände und Fehlermeldungen klar und auf Deutsch?
10. **Kollisionen:** Liegt irgendwann etwas über einem Titel, Betrag oder Knopf (beim Scrollen, Wischen, mit offener Tastatur)?

**Bewertung** (je 1–10, gewichtet): **Bedienbarkeit 40 %**, **Gestaltung 35 %**, **Bewegung/Haptik 15 %**, **Inhalt 10 %**.
`gesamt = 0,4·Bedienbarkeit + 0,35·Gestaltung + 0,15·Bewegung + 0,1·Inhalt`

**Obergrenzen** (überschreiben die Rechnung):
- Kontrast unter 4,5:1 bei Text (Hell oder Dunkel), Text auf Verlauf schlecht lesbar → Gestaltung max. 6.
- Tippfläche unter 44 px oder etwas verdeckt Betrag/Knopf → Bedienbarkeit max. 6.
- Falsche oder erfundene Zahl → Inhalt max. 4.
- Ruckeln/Sprung in einer Geste oder Animation läuft bei „Bewegung reduzieren“ weiter → Bewegung max. 5.
- Ein „Nicht verwenden“-Tell sichtbar → gesamt max. 6,5.

**Protokoll** (immer so, damit Runden vergleichbar sind):
```
RUNDE n
In einer Sekunde gesehen: …
Idee des Bildschirms (ein Satz): …
Bewertung: Bedienbarkeit _ · Gestaltung _ · Bewegung _ · Inhalt _ → gesamt _,_
Obergrenzen angewandt: …
Die drei größten Probleme (sichtbarstes zuerst), je mit Screenshot und Lösung:
1. …
2. …
3. …
```

**Reihenfolge beim Beheben:** Idee → Hierarchie → Anordnung/Abstände → Schrift → Farbe/Verläufe → Details/Zustände → Bewegung zuletzt.

**Wann aufhören:** höchstens drei Runden (Kritik → drei größte Probleme beheben → neue Screenshots → Kritik). Früher aufhören, wenn eine Runde nichts findet, was einem Fremden auffallen würde. Liegt Runde 3 noch unter 7,5, das offen berichten – nicht schönrechnen. Dem Nutzer vor dem Online-Stellen die Screenshots zeigen.
