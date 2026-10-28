# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 94 files · ~69,111 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 762 nodes · 2293 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3711fe9d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- actions.ts
- dates.ts
- StartPage.tsx
- package.json
- smoke.mjs
- recurring.ts
- deploy.yml
- gesture.ts
- backup.ts
- theme.ts
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 37 edges
2. `AppData` - 34 edges
3. `haptic()` - 34 edges
4. `useFinance()` - 34 edges
5. `Regeln` - 29 edges
6. `todayISO()` - 28 edges
7. `createVault()` - 27 edges
8. `Sheet()` - 26 edges
9. `SettingsPage()` - 25 edges
10. `StartPage()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `Greeting()`  [INFERRED]
  CLAUDE.md → src/components/Greeting.tsx
- `Regeln` --references--> `TransferRow()`  [INFERRED]
  CLAUDE.md → src/components/LedgerList.tsx

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.08
Nodes (52): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+44 more)

### Community 1 - "actions.ts"
Cohesion: 0.10
Nodes (46): mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS (+38 more)

### Community 2 - "dates.ts"
Cohesion: 0.06
Nodes (49): vitest, fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH (+41 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.06
Nodes (82): App(), AppContent(), FormState, StartNav, subOf(), BudgetForm(), save(), submit() (+74 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (38): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+30 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.05
Nodes (38): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, addTx(), balance(), bodyText() (+30 more)

### Community 6 - "recurring.ts"
Cohesion: 0.13
Nodes (31): RecurringForm(), submit(), RecurringManager(), nextLabel(), formatDateDE(), formatDayMonth(), ContractsSummary, dayOfMonthOf() (+23 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.12
Nodes (47): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+39 more)

### Community 9 - "backup.ts"
Cohesion: 0.08
Nodes (17): AddPreset, ContractBooking, UNDO_MS, UndoToast(), Account, Kind, TransferDirection, confirmImport() (+9 more)

### Community 10 - "theme.ts"
Cohesion: 0.30
Nodes (9): useThemePref(), applyTheme(), CHROME_COLOR, getThemePref(), PREFS, resolveTheme(), setThemePref(), THEME_KEY (+1 more)

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
Cohesion: 0.06
Nodes (78): Teil B: App-Sperre (optional, standardmäßig aus), Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), b64(), Bytes, canonical() (+70 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.06
Nodes (42): react, Greeting(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit() (+34 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `LockProvider.tsx` to `SettingsPage.tsx`, `StartPage.tsx`, `package.json`, `recurring.ts`, `gesture.ts`, `backup.ts`, `theme.ts`, `vault.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (optional, standardmäßig aus)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `SettingsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07857769973661106 - nodes in this community are weakly interconnected._
- **Why does `AppData` connect `dates.ts` to `SettingsPage.tsx`, `actions.ts`, `StartPage.tsx`, `recurring.ts`, `gesture.ts`, `backup.ts`, `vault.ts`, `LockProvider.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `TransferRow()`) actually correct?**
  _`Regeln` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09803921568627451 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `StartPage.tsx` to `SettingsPage.tsx`, `smoke.mjs`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._