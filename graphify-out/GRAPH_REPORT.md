# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 96 files · ~75,029 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 795 nodes · 2364 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62ba389f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- dates.ts
- package.json
- smoke.mjs
- FinanceContext.tsx
- deploy.yml
- gesture.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- types.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `useFinance()` - 35 edges
3. `AppData` - 34 edges
4. `haptic()` - 33 edges
5. `Regeln` - 33 edges
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
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `LockScreen()`  [INFERRED]
  CLAUDE.md → src/components/LockScreen.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `create()`  [INFERRED]
  CLAUDE.md → src/components/LockSetupSheet.tsx

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.07
Nodes (45): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+37 more)

### Community 1 - "actions.ts"
Cohesion: 0.06
Nodes (47): exportJSON(), mutate(), sample(), tx(), withBudget(), bookDue(), Interval, TransferDirection (+39 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.13
Nodes (13): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App (+5 more)

### Community 3 - "dates.ts"
Cohesion: 0.08
Nodes (56): Fab(), base, BudgetIcon(), CashIcon(), ChevronLeft(), ChevronRight(), ClearIcon(), ContractIcon() (+48 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (26): addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+18 more)

### Community 6 - "FinanceContext.tsx"
Cohesion: 0.07
Nodes (84): react, App(), AppContent(), FormState, StartNav, subOf(), BudgetForm(), save() (+76 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (68): Architektur, Regeln, RepeatIcon(), TrashIcon(), Phase, StackAnim, StartStack(), SubView (+60 more)

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
Cohesion: 0.06
Nodes (75): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), AUTO_LOCK_OPTIONS, b64(), Bytes, canonical() (+67 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.08
Nodes (40): Teil B: App-Sperre (optional, standardmäßig aus), Greeting(), EncryptedRepository, STORAGE_KEY, Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS (+32 more)

### Community 17 - "types.ts"
Cohesion: 0.07
Nodes (42): vitest, SwapIcon(), TransferRow, fail(), isAccount(), isDirection(), isInterval(), isKind() (+34 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `FinanceContext.tsx` to `SettingsPage.tsx`, `dates.ts`, `package.json`, `gesture.ts`, `vault.ts`, `LockProvider.tsx`, `types.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `SettingsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06820119352088662 - nodes in this community are weakly interconnected._
- **Why does `submit()` connect `FinanceContext.tsx` to `perf.mjs`, `dates.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (optional, standardmäßig aus)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `start()` connect `perf.mjs` to `FinanceContext.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._