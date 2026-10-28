# Zahlen im Pastell-Entwurf (Demo-Daten, heute = 28.10.2026)

Quelle: `scripts/seed.mjs` (Kopie aus design/farben), App aus `main` gebaut, im Browser mit Seed + eingerichteter Sperre geöffnet; Texte der Seiten in `scripts/jetzt-text.json`. Alle Werte unten wurden gegen die laufende App geprüft und stimmen.

| Wert | Zahl | Prüfung |
|---|---|---|
| Kontostand | 11.529,11 € | App-Start |
| Bargeld / Gesamt | 150,00 € / 11.679,11 € | App-Start |
| Zu bestätigen | Fitnessstudio −29,90 €, fällig 15.10. | App-Start |
| Budgets Gesamt Oktober | 1.335,39 € von 1.520,00 €, noch 184,61 €, 87,9 % | Budgets-Seite (Prozent = `round(1000·x/y)/10`, wie `budget.ts`; der Entwurf zeigt 87,9 %) |
| Freizeit | 82,40 € von 60,00 €, 137,3 %, 22,40 € drüber | Budgets-Seite |
| Lebensmittel | 276,55 € von 300,00 €, 92,2 %, noch 23,45 € | Budgets-Seite |
| Fixkosten | 879,99 € von 1.000,00 €, 88,0 %, noch 120,01 € | Budgets-Seite |
| Mobilität | 83,50 € von 120,00 €, 69,6 %, noch 36,50 € | Budgets-Seite |
| Gesundheit | 12,95 € von 40,00 €, 32,4 % | Budgets-Seite (im Entwurf aus Platzgründen unter dem Bildrand) |
| Demnächst fällig | Handyvertrag −19,99 € Fr 30.10.; Strom −62,00 € So 01.11.; Miete −860,00 € Mo 02.11. | App-Start |
| Start-Zeilen | Alle Buchungen 43; Bargeld 150,00 €; Verträge 5 · 971,89 €/Monat | App-Start |

## Kurve „Kontostand-Verlauf“ (nur Konto, Monatsende)

Abgeleitet aus dem Seed (`scripts/verlauf.mjs`, im Generator `build-mockups.mjs` wiederholt): Startsaldo 2.400,00 € + alle Konto-Buchungen (Einnahmen − Ausgaben) mit Datum ≤ Stichtag − Abhebungen (Umbuchung 100,00 € am 05.10.). Bargeld ist getrennt und nicht enthalten. Der Generator bricht ab, wenn der Oktober-Wert nicht 11.529,11 € ergibt (er stimmt).

| Monat | Kontostand Monatsende |
|---|---|
| Mai | 4.002,40 € |
| Jun | 5.465,40 € |
| Jul | 7.171,60 € |
| Aug | 8.736,70 € |
| Sep | 10.114,50 € |
| Okt | 11.529,11 € (Stand 28.10., nicht Monatsende) |

Plausibilität: Okt − Sep = 1.414,61 € = Saldo Oktober 1.514,61 € − 100 € Abhebung. Monatssalden der Monat-Seite: Mai 1.602,40, Jun 1.463,00, Jul 1.706,20, Aug 1.565,10, Sep 1.377,80, Okt 1.514,61 €.
Die Kurve ist eine monotone kubische Glättung durch genau diese sechs Punkte (kein Überschwingen, keine erfundenen Zwischenwerte). Im Bild stehen nur Anfangs- (4.002 €) und Endwert (11.529 €) auf ganze Euro gerundet.
