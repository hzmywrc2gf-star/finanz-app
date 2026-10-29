# Graph Report - finanz-app  (2026-10-29)

## Corpus Check
- 126 files · ~97,776 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .csv 2, .css 1)

## Summary
- 1002 nodes · 3094 edges · 30 communities (28 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 153 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01558af6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppData
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
- LockProvider.tsx
- FinanceApi
- exportSheet.ts
- importRows.ts
- Regeln
- vault.test.ts
- LockScreen.tsx
- csv.ts
- LockContext.ts
- Prüfen
- openStartPage
- bodyText
- openSettings

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 49 edges
2. `react` - 48 edges
3. `Regeln` - 44 edges
4. `AppData` - 40 edges
5. `haptic()` - 39 edges
6. `Architektur` - 35 edges
7. `todayISO()` - 34 edges
8. `StartPage` - 31 edges
9. `createVault()` - 27 edges
10. `vitest` - 26 edges

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

## Communities (30 total, 2 thin omitted)

### Community 0 - "AppData"
Cohesion: 0.19
Nodes (7): EncryptedRepository, LocalStorageRepository, STORAGE_KEY, FinanceRepository, vault, AppData, ImportResult

### Community 1 - "actions.ts"
Cohesion: 0.07
Nodes (56): vitest, mutate(), sample(), item(), tx(), withBudget(), isValidISODate(), builtInId() (+48 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.15
Nodes (11): ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen (+3 more)

### Community 3 - "App.tsx"
Cohesion: 0.07
Nodes (81): react, App(), AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf() (+73 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.10
Nodes (8): { chromium, devices }, deks, errors, futter, futterText, json, swipe(), swipeRow()

### Community 6 - "types.ts"
Cohesion: 0.10
Nodes (43): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+35 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.10
Nodes (52): Backlog (nicht in v1), TrashIcon(), NavStack(), Phase, StackAnim, SwipePane(), SwipeRow(), animationMs() (+44 more)

### Community 9 - "StartPage.tsx"
Cohesion: 0.06
Nodes (88): Architektur, start(), BalanceChart, monotonePath(), BudgetBar(), ChevronLeft(), RecurringForm(), submit() (+80 more)

### Community 10 - "perf.mjs"
Cohesion: 0.11
Nodes (20): center(), { chromium, devices }, errors, openBookings(), record(), REPS, results, rows (+12 more)

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
Nodes (85): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj() (+77 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.18
Nodes (17): Greeting(), VaultSession, greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput(), isPasskeyPrfLikelySupported() (+9 more)

### Community 17 - "FinanceApi"
Cohesion: 0.09
Nodes (3): ContractBookingInput, TransferInput, FinanceApi

### Community 18 - "exportSheet.ts"
Cohesion: 0.06
Nodes (55): out(), pan(), svg(), ImportSource, ALL_TIME, bookingLines(), buildExportSheets(), countExportRows() (+47 more)

### Community 19 - "importRows.ts"
Cohesion: 0.09
Nodes (47): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), resolveExportRange(), CASH_WORDS (+39 more)

### Community 20 - "Regeln"
Cohesion: 0.08
Nodes (43): Regeln, Fab(), ArchiveIcon(), base, BudgetIcon(), CashIcon(), ChevronRight(), ClearIcon() (+35 more)

### Community 21 - "vault.test.ts"
Cohesion: 0.19
Nodes (17): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+9 more)

### Community 22 - "LockScreen.tsx"
Cohesion: 0.27
Nodes (9): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+1 more)

### Community 23 - "csv.ts"
Cohesion: 0.30
Nodes (10): DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter(), parseCsv(), parseCsvText(), isOldExcel() (+2 more)

### Community 24 - "LockContext.ts"
Cohesion: 0.22
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 25 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 26 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 27 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 29 - "openSettings"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Regeln` connect `Regeln` to `AppData`, `actions.ts`, `Projektkontext: finanz-app („Finanzklar“)`, `App.tsx`, `types.ts`, `gesture.ts`, `StartPage.tsx`, `FinanceApi`, `openStartPage`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0703962703962704 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App.tsx` to `package.json`, `types.ts`, `gesture.ts`, `StartPage.tsx`, `LockProvider.tsx`, `importRows.ts`, `Regeln`, `LockScreen.tsx`, `LockContext.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `Regeln` (e.g. with `balance()` and `subOf()`) actually correct?**
  _`Regeln` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06645898234683281 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `openStartPage` to `bodyText`, `Regeln`, `smoke.mjs`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._