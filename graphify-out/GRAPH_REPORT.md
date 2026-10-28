# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 98 files · ~76,560 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 801 nodes · 2384 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 107 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df7154ef`
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
- App.tsx
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- Icons.tsx
- FinanceApi

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `useFinance()` - 35 edges
3. `Regeln` - 35 edges
4. `AppData` - 34 edges
5. `haptic()` - 34 edges
6. `Architektur` - 28 edges
7. `createVault()` - 27 edges
8. `todayISO()` - 27 edges
9. `Sheet()` - 26 edges
10. `StartPage` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `create()`  [INFERRED]
  CLAUDE.md → src/components/LockSetupSheet.tsx
- `Regeln` --references--> `RecurringForm()`  [INFERRED]
  CLAUDE.md → src/components/RecurringForm.tsx

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "StartPage.tsx"
Cohesion: 0.11
Nodes (38): start(), RecurringForm(), submit(), RecurringManager(), nextLabel(), SubPageHeader(), budgetAlerts(), accountBalance() (+30 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (50): vitest, exportJSON(), mutate(), sample(), item(), tx(), withBudget(), builtInId() (+42 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "dates.ts"
Cohesion: 0.11
Nodes (45): ChevronLeft(), ChevronRight(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), UnbudgetedSpending (+37 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (26): addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+18 more)

### Community 6 - "types.ts"
Cohesion: 0.07
Nodes (78): react, AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet() (+70 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.09
Nodes (62): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Regeln, Stack (+54 more)

### Community 9 - "App.tsx"
Cohesion: 0.11
Nodes (20): App(), AppContent(), FormState, StartNav, subOf(), StackAnim, TabBar(), TabId (+12 more)

### Community 10 - "perf.mjs"
Cohesion: 0.09
Nodes (23): center(), { chromium, devices }, errors, openBookings(), record(), REPS, results, rows (+15 more)

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
Nodes (52): Teil B: App-Sperre (optional, standardmäßig aus), Greeting(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit() (+44 more)

### Community 17 - "Icons.tsx"
Cohesion: 0.10
Nodes (34): Fab(), base, BudgetIcon(), CashIcon(), ClearIcon(), ContractIcon(), HomeIcon(), ListIcon() (+26 more)

### Community 18 - "FinanceApi"
Cohesion: 0.09
Nodes (3): ContractBookingInput, TransferInput, FinanceApi

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `StartPage.tsx`, `dates.ts`, `package.json`, `gesture.ts`, `App.tsx`, `vault.ts`, `LockProvider.tsx`, `Icons.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1072463768115942 - nodes in this community are weakly interconnected._
- **Why does `submit()` connect `StartPage.tsx` to `dates.ts`, `types.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `RecurringForm()`) actually correct?**
  _`Regeln` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08821548821548822 - nodes in this community are weakly interconnected._
- **Why does `start()` connect `StartPage.tsx` to `perf.mjs`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._