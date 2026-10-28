# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 102 files · ~81,451 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 825 nodes · 2497 edges · 23 communities (22 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af2d7924`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StartPage.tsx
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- types.ts
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- dates.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- FinanceApi
- vault.test.ts
- AppData
- LockScreen.tsx
- backup.ts
- LockContext.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 41 edges
2. `Regeln` - 38 edges
3. `AppData` - 37 edges
4. `useFinance()` - 35 edges
5. `haptic()` - 34 edges
6. `StartPage` - 31 edges
7. `todayISO()` - 30 edges
8. `Architektur` - 30 edges
9. `createVault()` - 27 edges
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

## Communities (23 total, 1 thin omitted)

### Community 0 - "StartPage.tsx"
Cohesion: 0.08
Nodes (54): start(), BudgetBar(), BudgetForm(), save(), submit(), ChevronRight(), RecurringForm(), submit() (+46 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (47): vitest, mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData() (+39 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "types.ts"
Cohesion: 0.06
Nodes (81): react, App(), AppContent(), FormState, StartNav, subOf(), Fab(), base (+73 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.07
Nodes (35): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+27 more)

### Community 6 - "types.ts"
Cohesion: 0.10
Nodes (46): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+38 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (71): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, react-dom (+63 more)

### Community 9 - "dates.ts"
Cohesion: 0.12
Nodes (32): BalanceChart, monotonePath(), accountBalance(), CategorySum, categorySums(), compareTransactionsDesc(), RangeTotals, summarizeRange() (+24 more)

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
Cohesion: 0.06
Nodes (78): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), AUTO_LOCK_OPTIONS, b64(), Bytes (+70 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.19
Nodes (17): Greeting(), greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput(), isPasskeyPrfLikelySupported(), newPrfSalt() (+9 more)

### Community 17 - "FinanceApi"
Cohesion: 0.09
Nodes (5): Interval, ContractBookingInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "vault.test.ts"
Cohesion: 0.19
Nodes (17): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+9 more)

### Community 19 - "AppData"
Cohesion: 0.20
Nodes (6): EncryptedRepository, LocalStorageRepository, STORAGE_KEY, FinanceRepository, vault, AppData

### Community 20 - "LockScreen.tsx"
Cohesion: 0.27
Nodes (9): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+1 more)

### Community 21 - "backup.ts"
Cohesion: 0.28
Nodes (11): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+3 more)

### Community 22 - "LockContext.ts"
Cohesion: 0.22
Nodes (3): AutoLockMinutes, LockApi, LockContext

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projektkontext: finanz-app („Finanzklar“)` connect `gesture.ts` to `Projektkontext: finanz-app („Finanzklar“)`, `smoke.mjs`, `vault.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 37 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `RecurringForm()`) actually correct?**
  _`Regeln` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07740384615384616 - nodes in this community are weakly interconnected._
- **Why does `react` connect `types.ts` to `StartPage.tsx`, `package.json`, `types.ts`, `gesture.ts`, `dates.ts`, `vault.ts`, `LockProvider.tsx`, `LockScreen.tsx`, `LockContext.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09154437456324249 - nodes in this community are weakly interconnected._
- **Why does `Prüfen` connect `smoke.mjs` to `gesture.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._