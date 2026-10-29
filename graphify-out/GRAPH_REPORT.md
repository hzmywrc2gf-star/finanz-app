# Graph Report - finanz-app  (2026-10-29)

## Corpus Check
- 131 files · ~103,887 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 1)

## Summary
- 1040 nodes · 3259 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cce18f35`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recurring.ts
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- App.tsx
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- StartPage.tsx
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- AppData
- FinanceApi
- exportSheet.ts
- importRows.ts
- AppLockSettings.tsx
- crypto.ts
- createVault
- backup.ts

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 51 edges
2. `react` - 49 edges
3. `Regeln` - 47 edges
4. `AppData` - 42 edges
5. `haptic()` - 42 edges
6. `todayISO()` - 36 edges
7. `Architektur` - 35 edges
8. `StartPage` - 31 edges
9. `vitest` - 28 edges
10. `Sheet()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `balance()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `withVault()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `keepAlive()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Regeln` --references--> `tabOf()`  [INFERRED]
  CLAUDE.md → src/App.tsx

## Import Cycles
- None detected.

## Communities (25 total, 2 thin omitted)

### Community 0 - "recurring.ts"
Cohesion: 0.11
Nodes (36): CheckIcon(), RecurringForm(), RecurringManager(), nextLabel(), plural(), RecurringSuggestions(), create(), never() (+28 more)

### Community 1 - "actions.ts"
Cohesion: 0.05
Nodes (81): vitest, mutate(), sample(), item(), tx(), withBudget(), isValidISODate(), builtInId() (+73 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "App.tsx"
Cohesion: 0.07
Nodes (79): react, App(), AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf() (+71 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.06
Nodes (37): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+29 more)

### Community 6 - "types.ts"
Cohesion: 0.17
Nodes (22): BackupExportSheet(), submit(), BackupImportSheet(), submit(), errMsg(), LockSetupScreen(), addFaceId(), create() (+14 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (71): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, react-dom (+63 more)

### Community 9 - "StartPage.tsx"
Cohesion: 0.05
Nodes (92): BalanceChart, monotonePath(), BudgetBar(), Fab(), ArchiveIcon(), base, BudgetIcon(), CashIcon() (+84 more)

### Community 10 - "perf.mjs"
Cohesion: 0.11
Nodes (21): center(), { chromium, devices }, errors, openBookings(), record(), REPS, results, rows (+13 more)

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
Cohesion: 0.09
Nodes (28): b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD, ERR_RECOVERY (+20 more)

### Community 16 - "AppData"
Cohesion: 0.05
Nodes (54): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit() (+46 more)

### Community 17 - "FinanceApi"
Cohesion: 0.10
Nodes (4): ContractBookingInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "exportSheet.ts"
Cohesion: 0.05
Nodes (61): out(), pan(), svg(), ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName() (+53 more)

### Community 19 - "importRows.ts"
Cohesion: 0.09
Nodes (49): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), ImportSheet(), changeSheet(), submit(), ImportSource, initialMapping(), plural(), CASH_WORDS (+41 more)

### Community 20 - "AppLockSettings.tsx"
Cohesion: 0.15
Nodes (20): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+12 more)

### Community 21 - "crypto.ts"
Cohesion: 0.17
Nodes (22): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), Bytes, decryptBytes(), decryptJSON(), encryptJSON(), ENVELOPE_FORMAT, ENVELOPE_VERSION, generateDataKey() (+14 more)

### Community 22 - "createVault"
Cohesion: 0.18
Nodes (21): createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot(), saveData() (+13 more)

### Community 23 - "backup.ts"
Cohesion: 0.28
Nodes (11): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+3 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Regeln` connect `gesture.ts` to `recurring.ts`, `actions.ts`, `App.tsx`, `smoke.mjs`, `types.ts`, `StartPage.tsx`, `AppData`, `FinanceApi`, `AppLockSettings.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `recurring.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10917874396135266 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `gesture.ts`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `Regeln` (e.g. with `balance()` and `subOf()`) actually correct?**
  _`Regeln` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05078929306794784 - nodes in this community are weakly interconnected._
- **Why does `AppData` connect `AppData` to `recurring.ts`, `actions.ts`, `App.tsx`, `types.ts`, `gesture.ts`, `StartPage.tsx`, `vault.ts`, `FinanceApi`, `exportSheet.ts`, `backup.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._