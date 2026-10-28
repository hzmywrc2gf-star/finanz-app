# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 96 files · ~74,426 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 793 nodes · 2361 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d4d96fbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- actions.ts
- AppData
- StartPage.tsx
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- backup.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- backup.ts
- vault.test.ts
- Projektkontext: finanz-app („Finanzklar“)
- LockContext.ts

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
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupImportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupImportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `Greeting()`  [INFERRED]
  CLAUDE.md → src/components/Greeting.tsx

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.07
Nodes (50): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+42 more)

### Community 1 - "actions.ts"
Cohesion: 0.08
Nodes (53): vitest, mutate(), sample(), budgetAlerts(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets (+45 more)

### Community 2 - "AppData"
Cohesion: 0.22
Nodes (5): EncryptedRepository, LocalStorageRepository, FinanceRepository, vault, AppData

### Community 3 - "StartPage.tsx"
Cohesion: 0.07
Nodes (70): Fab(), base, BudgetIcon(), CashIcon(), ChevronLeft(), ChevronRight(), ClearIcon(), ContractIcon() (+62 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (26): addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+18 more)

### Community 6 - "types.ts"
Cohesion: 0.06
Nodes (81): react, App(), AppContent(), FormState, StartNav, subOf(), BudgetForm(), save() (+73 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.08
Nodes (65): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+57 more)

### Community 9 - "backup.ts"
Cohesion: 0.09
Nodes (5): Interval, ContractBookingInput, RecurringInput, TransferInput, FinanceApi

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
Nodes (74): Teil B: App-Sperre (optional, standardmäßig aus), Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), b64(), Bytes, canonical(), createVault(), encryptData(), extractableDek() (+66 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.20
Nodes (16): Greeting(), greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput(), isPasskeyPrfLikelySupported(), newPrfSalt() (+8 more)

### Community 17 - "backup.ts"
Cohesion: 0.16
Nodes (18): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+10 more)

### Community 18 - "vault.test.ts"
Cohesion: 0.19
Nodes (17): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+9 more)

### Community 19 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 20 - "LockContext.ts"
Cohesion: 0.20
Nodes (3): AutoLockMinutes, LockApi, LockContext

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `SettingsPage.tsx`, `StartPage.tsx`, `package.json`, `gesture.ts`, `LockProvider.tsx`, `LockContext.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `SettingsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07374890254609306 - nodes in this community are weakly interconnected._
- **Why does `submit()` connect `types.ts` to `perf.mjs`, `StartPage.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (optional, standardmäßig aus)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07909604519774012 - nodes in this community are weakly interconnected._
- **Why does `start()` connect `perf.mjs` to `types.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._