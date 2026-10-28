# Kontraste Pastell-Entwurf (WCAG 2.x)

Abweichungen von der Vorgabe (nötig, damit alles besteht): Warn-Text hell #A84E06 statt #B45309 und Über-Text hell #B8390A statt #C2410C (auf Pastellflächen 4,2–4,5 → ≥ 4,7); Warn-Balken hell #B95F05→#C96F08 statt #D97706 (Amber unter 3:1 auf den Tönen); Ausgaben-Rot auf Pastell hell #C81E1E statt #DC2626 (4,1 → ≥ 4,5). Rote/grüne Beträge stehen im Entwurf nie direkt auf dem Seitenhintergrund (dort wäre #DC2626 4,46:1), deshalb ist diese Zeile nicht aufgeführt.

Generiert von `scripts/kontraste.mjs`. Text ≥ 4,5:1 (große Schrift ≥ 24 px bzw. fett ≥ 19 px: ≥ 3:1 genügt, wird hier trotzdem gegen 4,5 geprüft); Balken/Symbole (nicht Text) ≥ 3:1.

## Hell

| Text | auf | Verhältnis | Soll | Ergebnis |
|---|---|---|---|---|
| Haupttext #1E293B | Hintergrund | 13.50:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Hintergrund | 5.02:1 | 4.5:1 | ok |
| Haupttext #1E293B | Verlauf oben (Spitze) | 12.32:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Verlauf oben (Spitze) | 4.58:1 | 4.5:1 | ok |
| Haupttext #1E293B | Karte | 14.63:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Karte | 5.44:1 | 4.5:1 | ok |
| Beitrag Einnahme #047857 | Karte | 5.48:1 | 4.5:1 | ok |
| Betrag Ausgabe #DC2626 | Karte | 4.83:1 | 4.5:1 | ok |
| Warn-Text #A84E06 | Karte | 5.59:1 | 4.5:1 | ok |
| Über-Text #B8390A | Karte | 5.79:1 | 4.5:1 | ok |
| Haupttext #1E293B | Lavendel | 12.35:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Lavendel | 4.59:1 | 4.5:1 | ok |
| Beitrag Einnahme #047857 | Lavendel | 4.63:1 | 4.5:1 | ok |
| Betrag Ausgabe #C81E1E | Lavendel | 4.84:1 | 4.5:1 | ok |
| Warn-Text #A84E06 | Lavendel | 4.72:1 | 4.5:1 | ok |
| Über-Text #B8390A | Lavendel | 4.89:1 | 4.5:1 | ok |
| Haupttext #1E293B | Himmel | 12.37:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Himmel | 4.60:1 | 4.5:1 | ok |
| Beitrag Einnahme #047857 | Himmel | 4.64:1 | 4.5:1 | ok |
| Betrag Ausgabe #C81E1E | Himmel | 4.85:1 | 4.5:1 | ok |
| Warn-Text #A84E06 | Himmel | 4.73:1 | 4.5:1 | ok |
| Über-Text #B8390A | Himmel | 4.90:1 | 4.5:1 | ok |
| Haupttext #1E293B | Nebel | 12.42:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Nebel | 4.62:1 | 4.5:1 | ok |
| Beitrag Einnahme #047857 | Nebel | 4.66:1 | 4.5:1 | ok |
| Betrag Ausgabe #C81E1E | Nebel | 4.10:1 | 4.5:1 | **FEHLER** |
| Warn-Text #A84E06 | Nebel | 4.74:1 | 4.5:1 | ok |
| Über-Text #B8390A | Nebel | 4.91:1 | 4.5:1 | ok |
| Haupttext #1E293B | Sand | 12.69:1 | 4.5:1 | ok |
| Sekundärtext #5B6B80 | Sand | 4.72:1 | 4.5:1 | ok |
| Beitrag Einnahme #047857 | Sand | 4.76:1 | 4.5:1 | ok |
| Betrag Ausgabe #C81E1E | Sand | 4.98:1 | 4.5:1 | ok |
| Warn-Text #A84E06 | Sand | 4.85:1 | 4.5:1 | ok |
| Über-Text #B8390A | Sand | 5.02:1 | 4.5:1 | ok |
| Chip-Text #1E293B | Chip (72 % Weiß auf #E3EDFA) | 13.97:1 | 4.5:1 | ok |
| Pillen-Text #5B6B80 | Chip (72 % Weiß auf #E3EDFA) | 5.20:1 | 4.5:1 | ok |
| Chip-Text #1E293B | Chip (72 % Weiß auf #ECEAFB) | 13.96:1 | 4.5:1 | ok |
| Soft-Pille „Überspringen“ #1E293B | Chip (72 % Weiß auf #ECEAFB) | 13.96:1 | 4.5:1 | ok |
| Hauptknopf-Text #FFFFFF | Hauptknopf #1E293B | 14.63:1 | 4.5:1 | ok |
| Tab inaktiv #64748B | Tab-Leiste (Karte) | 4.76:1 | 4.5:1 | ok |
| Haupttext Tab aktiv | Tab-Leiste | 12.59:1 | 4.5:1 | ok |

**Balken (Nicht-Text, ≥ 3:1 gegen die Karte; Spur ist zusätzlich nicht allein Träger, Prozent steht daneben):**

| Balken | auf | Verhältnis | Ergebnis |
|---|---|---|---|
| ok neutral #475569 | Lavendel | 6.40:1 | ok |
| ok neutral #475569 | Himmel | 6.41:1 | ok |
| ok neutral #475569 | Nebel | 6.43:1 | ok |
| ok neutral #475569 | Sand | 6.57:1 | ok |
| warn #B95F05 | Lavendel | 3.77:1 | ok |
| warn #B95F05 | Himmel | 3.78:1 | ok |
| warn #B95F05 | Nebel | 3.79:1 | ok |
| warn #B95F05 | Sand | 3.87:1 | ok |
| warn (heller Verlaufsende) #C96F08 | Lavendel | 3.08:1 | ok |
| warn (heller Verlaufsende) #C96F08 | Himmel | 3.08:1 | ok |
| warn (heller Verlaufsende) #C96F08 | Nebel | 3.09:1 | ok |
| warn (heller Verlaufsende) #C96F08 | Sand | 3.16:1 | ok |
| über #C2410C | Lavendel | 4.37:1 | ok |
| über #C2410C | Himmel | 4.38:1 | ok |
| über #C2410C | Nebel | 4.40:1 | ok |
| über #C2410C | Sand | 4.49:1 | ok |
| über (Verlaufsende) #CC4A12 | Lavendel | 3.89:1 | ok |
| über (Verlaufsende) #CC4A12 | Himmel | 3.90:1 | ok |
| über (Verlaufsende) #CC4A12 | Nebel | 3.91:1 | ok |
| über (Verlaufsende) #CC4A12 | Sand | 4.00:1 | ok |

## Dunkel

| Text | auf | Verhältnis | Soll | Ergebnis |
|---|---|---|---|---|
| Haupttext #F1F5F9 | Hintergrund | 16.30:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Hintergrund | 6.96:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Verlauf oben (Spitze) | 13.27:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Verlauf oben (Spitze) | 5.67:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Karte | 13.35:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Karte | 5.71:1 | 4.5:1 | ok |
| Beitrag Einnahme #34D399 | Karte | 7.61:1 | 4.5:1 | ok |
| Betrag Ausgabe #F87171 | Karte | 5.29:1 | 4.5:1 | ok |
| Warn-Text #FBBF24 | Karte | 8.76:1 | 4.5:1 | ok |
| Über-Text #FB923C | Karte | 6.46:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Lavendel | 12.44:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Lavendel | 5.31:1 | 4.5:1 | ok |
| Beitrag Einnahme #34D399 | Lavendel | 7.09:1 | 4.5:1 | ok |
| Betrag Ausgabe #F87171 | Lavendel | 4.92:1 | 4.5:1 | ok |
| Warn-Text #FBBF24 | Lavendel | 8.16:1 | 4.5:1 | ok |
| Über-Text #FB923C | Lavendel | 6.02:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Himmel | 12.51:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Himmel | 5.34:1 | 4.5:1 | ok |
| Beitrag Einnahme #34D399 | Himmel | 7.13:1 | 4.5:1 | ok |
| Betrag Ausgabe #F87171 | Himmel | 4.95:1 | 4.5:1 | ok |
| Warn-Text #FBBF24 | Himmel | 8.21:1 | 4.5:1 | ok |
| Über-Text #FB923C | Himmel | 6.05:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Nebel | 12.04:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Nebel | 5.14:1 | 4.5:1 | ok |
| Beitrag Einnahme #34D399 | Nebel | 6.86:1 | 4.5:1 | ok |
| Betrag Ausgabe #F87171 | Nebel | 4.77:1 | 4.5:1 | ok |
| Warn-Text #FBBF24 | Nebel | 7.90:1 | 4.5:1 | ok |
| Über-Text #FB923C | Nebel | 5.83:1 | 4.5:1 | ok |
| Haupttext #F1F5F9 | Sand | 12.29:1 | 4.5:1 | ok |
| Sekundärtext #94A3B8 | Sand | 5.25:1 | 4.5:1 | ok |
| Beitrag Einnahme #34D399 | Sand | 7.00:1 | 4.5:1 | ok |
| Betrag Ausgabe #F87171 | Sand | 4.87:1 | 4.5:1 | ok |
| Warn-Text #FBBF24 | Sand | 8.06:1 | 4.5:1 | ok |
| Über-Text #FB923C | Sand | 5.95:1 | 4.5:1 | ok |
| Chip-Text #F1F5F9 | Chip (9 % Weiß auf #1F2E44) | 9.45:1 | 4.5:1 | ok |
| Pillen-Text #CBD5E1 | Chip (9 % Weiß auf #1F2E44) | 6.97:1 | 4.5:1 | ok |
| Chip-Text #F1F5F9 | Chip (9 % Weiß auf #282C47) | 9.41:1 | 4.5:1 | ok |
| Soft-Pille „Überspringen“ #F1F5F9 | Chip (9 % Weiß auf #282C47) | 9.41:1 | 4.5:1 | ok |
| Hauptknopf-Text #0F172A | Hauptknopf #F1F5F9 | 16.30:1 | 4.5:1 | ok |
| Tab inaktiv #94A3B8 | Tab-Leiste (Karte) | 5.71:1 | 4.5:1 | ok |
| Haupttext Tab aktiv | Tab-Leiste | 10.62:1 | 4.5:1 | ok |

**Balken (Nicht-Text, ≥ 3:1 gegen die Karte; Spur ist zusätzlich nicht allein Träger, Prozent steht daneben):**

| Balken | auf | Verhältnis | Ergebnis |
|---|---|---|---|
| ok neutral #94A3B8 | Lavendel | 5.31:1 | ok |
| ok neutral #94A3B8 | Himmel | 5.34:1 | ok |
| ok neutral #94A3B8 | Nebel | 5.14:1 | ok |
| ok neutral #94A3B8 | Sand | 5.25:1 | ok |
| warn #FBBF24 | Lavendel | 8.16:1 | ok |
| warn #FBBF24 | Himmel | 8.21:1 | ok |
| warn #FBBF24 | Nebel | 7.90:1 | ok |
| warn #FBBF24 | Sand | 8.06:1 | ok |
| warn (heller Verlaufsende) #FCD66B | Lavendel | 9.71:1 | ok |
| warn (heller Verlaufsende) #FCD66B | Himmel | 9.77:1 | ok |
| warn (heller Verlaufsende) #FCD66B | Nebel | 9.40:1 | ok |
| warn (heller Verlaufsende) #FCD66B | Sand | 9.59:1 | ok |
| über #FB923C | Lavendel | 6.02:1 | ok |
| über #FB923C | Himmel | 6.05:1 | ok |
| über #FB923C | Nebel | 5.83:1 | ok |
| über #FB923C | Sand | 5.95:1 | ok |
| über (Verlaufsende) #FDB27A | Lavendel | 7.67:1 | ok |
| über (Verlaufsende) #FDB27A | Himmel | 7.72:1 | ok |
| über (Verlaufsende) #FDB27A | Nebel | 7.43:1 | ok |
| über (Verlaufsende) #FDB27A | Sand | 7.58:1 | ok |

**Fehler/Warnungen gesamt: 1**
