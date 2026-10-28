# ECC-Bausteine (Everything Claude Code)

Ausgewählte Agenten und Skills aus [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), Stand `25278e7`, unverändert übernommen. Lizenz: MIT, Copyright (c) 2026 Affaan Mustafa (Lizenztext unten).

Vor der Übernahme gelesen und geprüft: keine Hooks, keine Skripte, keine Netzwerkzugriffe; nur Markdown-Anweisungen.

## Was wofür
| Baustein | Einsatz in Finanzklar |
|---|---|
| `agents/planner.md` (opus) | Planung größerer Schritte (Plan → OK des Nutzers → Umsetzung) |
| `agents/code-reviewer.md`, `react-reviewer.md`, `typescript-reviewer.md` (sonnet) | Review nach der Umsetzung, vor dem Merge auf `main` |
| `agents/security-reviewer.md` (sonnet) | Bei Änderungen an Verschlüsselung, App-Sperre, Backup/Import |
| `agents/performance-optimizer.md` (sonnet) | Bei Ruckeln/Ladezeit; Messung mit `e2e/perf.mjs` |
| `agents/a11y-architect.md` (sonnet) | Barrierefreiheit (Kontraste, Tippflächen, Screenreader) |
| `skills/verification-loop` | Abschlussprüfung: Build, Typen, Lint, Tests, Diff |
| `skills/react-performance`, `vite-patterns`, `frontend-a11y`, `security-review` | Nachschlagewerk für die jeweiligen Themen |

Bewusst nicht übernommen: Hooks (würden automatisch Programme ausführen), `e2e-runner` (setzt auf ein anderes Testwerkzeug als unser Playwright-`e2e/smoke.mjs`), sprach-/framework-fremde Teile.

Die Agenten sind teils als „PROACTIVELY / MUST BE USED“ beschrieben. Im Projekt gilt trotzdem: gezielt einsetzen (Review-Schritt), um das Nutzungslimit zu schonen.

## Lizenz
```
MIT License

Copyright (c) 2026 Affaan Mustafa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
