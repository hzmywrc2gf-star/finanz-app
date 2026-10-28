# Kontraste Farbversuch (WCAG 2.1)

Berechnet mit `design/farben/scripts/kontraste.mjs` (relative Luminanz, sRGB). Grenzen: Text 4,5:1, großer Text und UI-Komponenten/Grafiken 3:1. Halbtransparente Flächen (Tab-Leiste) sind gegen den Hintergrund verrechnet.

## V1 wörtlich – hell

| Paar | Vordergrund | Hintergrund | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|---|---|
| Text auf Karte | #1E293B | #FFFFFF | 14.63:1 | Text 4,5 | bestanden |
| Text auf Hintergrund | #1E293B | #F4F6F8 | 13.50:1 | Text 4,5 | bestanden |
| Sekundärtext auf Karte | #64748B | #FFFFFF | 4.76:1 | Text 4,5 | bestanden |
| Sekundärtext auf Hintergrund (Abschnittstitel) | #64748B | #F4F6F8 | 4.39:1 | Text 4,5 | **FEHLER** |
| Sekundärtext auf Eingabe-/Knopffläche (#F1F5F9) | #64748B | #F1F5F9 | 4.34:1 | Text 4,5 | **FEHLER** |
| Primärknopf: Text auf Knopf | #FFFFFF | #10B981 | 2.54:1 | Text 4,5 | **FEHLER** |
| Primärknopf gegen Karte/Hintergrund (UI-Fläche) | #10B981 | #F4F6F8 | 2.34:1 | UI/Groß 3 | **FEHLER** |
| Link/Sekundäraktion auf Karte | #10B981 | #FFFFFF | 2.54:1 | Text 4,5 | **FEHLER** |
| Link auf Hintergrund (Sperrbildschirm „Passwort verwenden“) | #10B981 | #F4F6F8 | 2.34:1 | Text 4,5 | **FEHLER** |
| Link auf Knopffläche #F1F5F9 („Überspringen“) | #10B981 | #F1F5F9 | 2.32:1 | Text 4,5 | **FEHLER** |
| Einnahme-Betrag (Text) auf Karte | #10B981 | #FFFFFF | 2.54:1 | Text 4,5 | **FEHLER** |
| Ausgabe-Betrag (Text) auf Karte | #DC2626 | #FFFFFF | 4.83:1 | Text 4,5 | bestanden |
| Ok-Text (Budget) auf Karte | #10B981 | #FFFFFF | 2.54:1 | Text 4,5 | **FEHLER** |
| Warn-Text auf Karte | #B45309 | #FFFFFF | 5.02:1 | Text 4,5 | bestanden |
| Diagramm/Balken Einnahme gegen Karte | #10B981 | #FFFFFF | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Diagramm/Balken Ausgabe gegen Karte | #DC2626 | #FFFFFF | 4.83:1 | UI/Groß 3 | bestanden |
| Budget-Balken ok gegen Spur (#F1F5F9) | #10B981 | #F1F5F9 | 2.32:1 | UI/Groß 3 | **FEHLER** |
| Budget-Balken warn gegen Karte | #D97706 | #FFFFFF | 3.19:1 | UI/Groß 3 | bestanden |
| Schalter AN: Spur gegen Karte | #10B981 | #FFFFFF | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Schalter AN: weißer Knauf gegen Spur | #FFFFFF | #10B981 | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Tab aktiv (Symbol+Text 10 px) auf Tab-Leiste | #10B981 | #FDFEFE | 2.51:1 | Text 4,5 | **FEHLER** |
| Tab inaktiv (Text 10 px) | #94A3B8 | #FDFEFE | 2.54:1 | Text 4,5 | **FEHLER** |
| Löschen: weißer Text auf Rot | #FFFFFF | #DC2626 | 4.83:1 | Text 4,5 | bestanden |
| Toast: weißer Text auf Slate | #FFFFFF | #1E293B | 14.63:1 | Text 4,5 | bestanden |
| Toast: „Rückgängig“ (#34D399) auf Slate | #34D399 | #1E293B | 7.61:1 | Text 4,5 | bestanden |
| Kachel Alle Buchungen: Symbol auf Kachel | #FFFFFF | #10B981 | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Kachel Bargeld: Symbol auf Kachel | #FFFFFF | #1E293B | 14.63:1 | UI/Groß 3 | bestanden |
| Kachel Verträge: Symbol auf Kachel | #1E293B | #D9B46A | 7.44:1 | UI/Groß 3 | bestanden |
| Kachel Verträge gegen Karte (nur Deko) | #D9B46A | #FFFFFF | 1.97:1 | UI/Groß 3 | **FEHLER** |
| Icon: Gold #D9B46A auf Slate #1E293B | #D9B46A | #1E293B | 7.44:1 | UI/Groß 3 | bestanden |
| Gold #D9B46A als Text auf Weiß (nicht verwendet) | #D9B46A | #FFFFFF | 1.97:1 | Text 4,5 | **FEHLER** |

## V1 wörtlich – dunkel

| Paar | Vordergrund | Hintergrund | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|---|---|
| Text auf Karte | #F1F5F9 | #1E293B | 13.35:1 | Text 4,5 | bestanden |
| Text auf Hintergrund | #F1F5F9 | #0F172A | 16.30:1 | Text 4,5 | bestanden |
| Sekundärtext auf Karte | #94A3B8 | #1E293B | 5.71:1 | Text 4,5 | bestanden |
| Sekundärtext auf Hintergrund | #94A3B8 | #0F172A | 6.96:1 | Text 4,5 | bestanden |
| Sekundärtext auf erhöhter Fläche (#273449) | #94A3B8 | #273449 | 4.89:1 | Text 4,5 | bestanden |
| Primärknopf: Text auf Knopf | #FFFFFF | #10B981 | 2.54:1 | Text 4,5 | **FEHLER** |
| Primärknopf gegen Karte (UI-Fläche) | #10B981 | #1E293B | 5.77:1 | UI/Groß 3 | bestanden |
| Link auf Karte | #10B981 | #1E293B | 5.77:1 | Text 4,5 | bestanden |
| Link auf Hintergrund | #10B981 | #0F172A | 7.04:1 | Text 4,5 | bestanden |
| Link auf erhöhter Fläche (#273449) | #10B981 | #273449 | 4.95:1 | Text 4,5 | bestanden |
| Einnahme-Betrag auf Karte | #10B981 | #1E293B | 5.77:1 | Text 4,5 | bestanden |
| Ausgabe-Betrag auf Karte | #F87171 | #1E293B | 5.29:1 | Text 4,5 | bestanden |
| Warn-Text auf Karte | #FBBF24 | #1E293B | 8.76:1 | Text 4,5 | bestanden |
| Balken Einnahme gegen Karte | #10B981 | #1E293B | 5.77:1 | UI/Groß 3 | bestanden |
| Balken Ausgabe gegen Karte | #F87171 | #1E293B | 5.29:1 | UI/Groß 3 | bestanden |
| Budget-Balken warn gegen Karte | #FBBF24 | #1E293B | 8.76:1 | UI/Groß 3 | bestanden |
| Schalter AN: Spur gegen Karte | #10B981 | #1E293B | 5.77:1 | UI/Groß 3 | bestanden |
| Schalter AN: weißer Knauf gegen Spur | #FFFFFF | #10B981 | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Tab aktiv auf Tab-Leiste | #10B981 | #1C2639 | 5.97:1 | Text 4,5 | bestanden |
| Tab inaktiv (#94A3B8) | #94A3B8 | #1C2639 | 5.91:1 | Text 4,5 | bestanden |
| Löschen: weißer Text auf Rot #DC2626 | #FFFFFF | #DC2626 | 4.83:1 | Text 4,5 | bestanden |
| Toast: Text auf #273449 | #F1F5F9 | #273449 | 11.45:1 | Text 4,5 | bestanden |
| Toast: „Rückgängig“ auf #273449 | #34D399 | #273449 | 6.53:1 | Text 4,5 | bestanden |
| Kachel Alle Buchungen: Symbol | #FFFFFF | #10B981 | 2.54:1 | UI/Groß 3 | **FEHLER** |
| Kachel Bargeld: Symbol | #F1F5F9 | #334155 | 9.45:1 | UI/Groß 3 | bestanden |
| Kachel Verträge: Symbol | #0F172A | #E5C886 | 11.00:1 | UI/Groß 3 | bestanden |

## V2 angepasst – hell

| Paar | Vordergrund | Hintergrund | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|---|---|
| Text auf Karte | #1E293B | #FFFFFF | 14.63:1 | Text 4,5 | bestanden |
| Text auf Hintergrund | #1E293B | #F4F6F8 | 13.50:1 | Text 4,5 | bestanden |
| Sekundärtext auf Karte | #5B6B80 | #FFFFFF | 5.44:1 | Text 4,5 | bestanden |
| Sekundärtext auf Hintergrund (Abschnittstitel) | #5B6B80 | #F4F6F8 | 5.02:1 | Text 4,5 | bestanden |
| Sekundärtext auf Eingabe-/Knopffläche (#F1F5F9) | #5B6B80 | #F1F5F9 | 4.97:1 | Text 4,5 | bestanden |
| Primärknopf: Text auf Knopf | #FFFFFF | #1E293B | 14.63:1 | Text 4,5 | bestanden |
| Primärknopf gegen Karte/Hintergrund (UI-Fläche) | #1E293B | #F4F6F8 | 13.50:1 | UI/Groß 3 | bestanden |
| Link/Sekundäraktion auf Karte | #047857 | #FFFFFF | 5.48:1 | Text 4,5 | bestanden |
| Link auf Hintergrund (Sperrbildschirm „Passwort verwenden“) | #047857 | #F4F6F8 | 5.06:1 | Text 4,5 | bestanden |
| Link auf Knopffläche #F1F5F9 („Überspringen“) | #047857 | #F1F5F9 | 5.01:1 | Text 4,5 | bestanden |
| Einnahme-Betrag (Text) auf Karte | #047857 | #FFFFFF | 5.48:1 | Text 4,5 | bestanden |
| Ausgabe-Betrag (Text) auf Karte | #DC2626 | #FFFFFF | 4.83:1 | Text 4,5 | bestanden |
| Ok-Text (Budget) auf Karte | #047857 | #FFFFFF | 5.48:1 | Text 4,5 | bestanden |
| Warn-Text auf Karte | #B45309 | #FFFFFF | 5.02:1 | Text 4,5 | bestanden |
| Diagramm/Balken Einnahme gegen Karte | #059669 | #FFFFFF | 3.77:1 | UI/Groß 3 | bestanden |
| Diagramm/Balken Ausgabe gegen Karte | #DC2626 | #FFFFFF | 4.83:1 | UI/Groß 3 | bestanden |
| Budget-Balken ok gegen Spur (#F1F5F9) | #059669 | #F1F5F9 | 3.44:1 | UI/Groß 3 | bestanden |
| Budget-Balken warn gegen Karte | #D97706 | #FFFFFF | 3.19:1 | UI/Groß 3 | bestanden |
| Schalter AN: Spur gegen Karte | #059669 | #FFFFFF | 3.77:1 | UI/Groß 3 | bestanden |
| Schalter AN: weißer Knauf gegen Spur | #FFFFFF | #059669 | 3.77:1 | UI/Groß 3 | bestanden |
| Tab aktiv (Symbol+Text 10 px) auf Tab-Leiste | #1E293B | #FDFEFE | 14.48:1 | Text 4,5 | bestanden |
| Tab inaktiv (Text 10 px) | #64748B | #FDFEFE | 4.71:1 | Text 4,5 | bestanden |
| Löschen: weißer Text auf Rot | #FFFFFF | #DC2626 | 4.83:1 | Text 4,5 | bestanden |
| Toast: weißer Text auf Slate | #FFFFFF | #1E293B | 14.63:1 | Text 4,5 | bestanden |
| Toast: „Rückgängig“ (#34D399) auf Slate | #34D399 | #1E293B | 7.61:1 | Text 4,5 | bestanden |
| Kachel Alle Buchungen: Symbol auf Kachel | #FFFFFF | #1E293B | 14.63:1 | UI/Groß 3 | bestanden |
| Kachel Bargeld: Symbol auf Kachel | #FFFFFF | #059669 | 3.77:1 | UI/Groß 3 | bestanden |
| Kachel Verträge: Symbol auf Kachel | #FFFFFF | #64748B | 4.76:1 | UI/Groß 3 | bestanden |
| Kachel Verträge gegen Karte (nur Deko) | #64748B | #FFFFFF | 4.76:1 | UI/Groß 3 | bestanden |
| Icon: Gold #D9B46A auf Slate #1E293B | #D9B46A | #1E293B | 7.44:1 | UI/Groß 3 | bestanden |
| Gold #D9B46A als Text auf Weiß (nicht verwendet) | #D9B46A | #FFFFFF | 1.97:1 | Text 4,5 | **FEHLER** |

## V2 angepasst – dunkel

| Paar | Vordergrund | Hintergrund | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|---|---|
| Text auf Karte | #F1F5F9 | #1E293B | 13.35:1 | Text 4,5 | bestanden |
| Text auf Hintergrund | #F1F5F9 | #0F172A | 16.30:1 | Text 4,5 | bestanden |
| Sekundärtext auf Karte | #94A3B8 | #1E293B | 5.71:1 | Text 4,5 | bestanden |
| Sekundärtext auf Hintergrund | #94A3B8 | #0F172A | 6.96:1 | Text 4,5 | bestanden |
| Sekundärtext auf erhöhter Fläche (#273449) | #94A3B8 | #273449 | 4.89:1 | Text 4,5 | bestanden |
| Primärknopf: Text auf Knopf | #0F172A | #34D399 | 9.29:1 | Text 4,5 | bestanden |
| Primärknopf gegen Karte (UI-Fläche) | #34D399 | #1E293B | 7.61:1 | UI/Groß 3 | bestanden |
| Link auf Karte | #34D399 | #1E293B | 7.61:1 | Text 4,5 | bestanden |
| Link auf Hintergrund | #34D399 | #0F172A | 9.29:1 | Text 4,5 | bestanden |
| Link auf erhöhter Fläche (#273449) | #34D399 | #273449 | 6.53:1 | Text 4,5 | bestanden |
| Einnahme-Betrag auf Karte | #34D399 | #1E293B | 7.61:1 | Text 4,5 | bestanden |
| Ausgabe-Betrag auf Karte | #F87171 | #1E293B | 5.29:1 | Text 4,5 | bestanden |
| Warn-Text auf Karte | #FBBF24 | #1E293B | 8.76:1 | Text 4,5 | bestanden |
| Balken Einnahme gegen Karte | #34D399 | #1E293B | 7.61:1 | UI/Groß 3 | bestanden |
| Balken Ausgabe gegen Karte | #F87171 | #1E293B | 5.29:1 | UI/Groß 3 | bestanden |
| Budget-Balken warn gegen Karte | #FBBF24 | #1E293B | 8.76:1 | UI/Groß 3 | bestanden |
| Schalter AN: Spur gegen Karte | #059669 | #1E293B | 3.88:1 | UI/Groß 3 | bestanden |
| Schalter AN: weißer Knauf gegen Spur | #FFFFFF | #059669 | 3.77:1 | UI/Groß 3 | bestanden |
| Tab aktiv auf Tab-Leiste | #F1F5F9 | #1C2639 | 13.83:1 | Text 4,5 | bestanden |
| Tab inaktiv (#94A3B8) | #94A3B8 | #1C2639 | 5.91:1 | Text 4,5 | bestanden |
| Löschen: weißer Text auf Rot #DC2626 | #FFFFFF | #DC2626 | 4.83:1 | Text 4,5 | bestanden |
| Toast: Text auf #273449 | #F1F5F9 | #273449 | 11.45:1 | Text 4,5 | bestanden |
| Toast: „Rückgängig“ auf #273449 | #34D399 | #273449 | 6.53:1 | Text 4,5 | bestanden |
| Kachel Alle Buchungen: Symbol | #F1F5F9 | #334155 | 9.45:1 | UI/Groß 3 | bestanden |
| Kachel Bargeld: Symbol | #FFFFFF | #059669 | 3.77:1 | UI/Groß 3 | bestanden |
| Kachel Verträge: Symbol | #FFFFFF | #64748B | 4.76:1 | UI/Groß 3 | bestanden |

## Zusammenfassung Fehler

- V1 hell: 18 Paar(e) unter Grenze
- V1 dunkel: 3 Paar(e) unter Grenze
- V2 hell: 1 Paar(e) unter Grenze
- V2 dunkel: 0 Paar(e) unter Grenze

Hinweis: Zeilen wie „Gold als Text auf Weiß“ und „Kachel gegen Karte (nur Deko)“ dokumentieren bewusst, warum Gold nie Text trägt und Kacheln nur Zierde sind; sie zählen in der Summe mit.
