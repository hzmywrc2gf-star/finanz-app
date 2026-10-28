# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 98 files · ~78,297 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 810 nodes · 2417 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67262435`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StartPage.tsx
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- dates.ts
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `useFinance()` - 35 edges
3. `Regeln` - 35 edges
4. `AppData` - 34 edges
5. `haptic()` - 34 edges
6. `todayISO()` - 30 edges
7. `Architektur` - 28 edges
8. `createVault()` - 27 edges
9. `StartPage` - 25 edges
10. `Sheet()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Prüfen` --references--> `withVault()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `keepAlive()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "StartPage.tsx"
Cohesion: 0.07
Nodes (57): App(), AppContent(), FormState, StartNav, subOf(), Fab(), base, BudgetIcon() (+49 more)

### Community 1 - "actions.ts"
Cohesion: 0.05
Nodes (51): mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS (+43 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "dates.ts"
Cohesion: 0.07
Nodes (68): ChevronLeft(), ChevronRight(), RepeatIcon(), LedgerList, TransferRow, TransactionList, TransactionRow, BudgetItem (+60 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.07
Nodes (35): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+27 more)

### Community 6 - "types.ts"
Cohesion: 0.07
Nodes (80): react, AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet() (+72 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (70): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, react-dom (+62 more)

### Community 10 - "perf.mjs"
Cohesion: 0.09
Nodes (24): center(), { chromium, devices }, errors, openBookings(), record(), REPS, results, rows (+16 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "vault.ts"
Cohesion: 0.05
Nodes (87): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), fail(), isAccount(), isDirection(), isInterval(), isKind() (+79 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.05
Nodes (53): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit() (+45 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `StartPage.tsx`, `dates.ts`, `package.json`, `gesture.ts`, `vault.ts`, `LockProvider.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06716417910447761 - nodes in this community are weakly interconnected._
- **Why does `Projektkontext: finanz-app („Finanzklar“)` connect `gesture.ts` to `Projektkontext: finanz-app („Finanzklar“)`, `smoke.mjs`, `vault.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `RecurringForm()`) actually correct?**
  _`Regeln` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05473684210526316 - nodes in this community are weakly interconnected._
- **Why does `Prüfen` connect `smoke.mjs` to `gesture.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._