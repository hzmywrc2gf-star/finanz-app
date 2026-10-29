# Graph Report - finanz-app  (2026-10-29)

## Corpus Check
- 138 files · ~112,117 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 1)

## Summary
- 1105 nodes · 3565 edges · 35 communities (33 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 180 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea95e328`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- domain/types.ts
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- FinanceContext.tsx
- package.json
- smoke.mjs
- recurringDetect.ts
- deploy.yml
- gesture.ts
- Icons.tsx
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
- LockScreen.tsx
- crypto.ts
- createVault
- AppData
- dates.ts
- vitest
- LedgerList.tsx
- MonthPage.tsx
- defaults.ts
- vault.test.ts
- App.tsx
- Kind
- isValidISODate
- LockContext.ts

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 57 edges
2. `react` - 50 edges
3. `haptic()` - 50 edges
4. `Architektur` - 48 edges
5. `Regeln` - 48 edges
6. `AppData` - 45 edges
7. `todayISO()` - 40 edges
8. `StartPage` - 39 edges
9. `Sheet()` - 32 edges
10. `vitest` - 31 edges

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

## Communities (35 total, 2 thin omitted)

### Community 0 - "domain/types.ts"
Cohesion: 0.08
Nodes (62): Architektur, Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), RFC-5545, ReceiptIcon(), InvoiceFlow, InvoiceListSheet(), submit(), budgetAlerts() (+54 more)

### Community 1 - "actions.ts"
Cohesion: 0.14
Nodes (30): addCategory(), AddRecurringOptions, bookNextNow(), bookOccurrence(), changeInvoiceAmount(), confirmOccurrence(), deleteCategory(), deleteInvoice() (+22 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "FinanceContext.tsx"
Cohesion: 0.06
Nodes (87): react, AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet() (+79 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.06
Nodes (37): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+29 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.12
Nodes (31): CheckIcon(), RefreshIcon(), plural(), RecurringSuggestions(), create(), never(), recurrenceLabel(), amountClusters() (+23 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (69): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, react-dom, App() (+61 more)

### Community 9 - "Icons.tsx"
Cohesion: 0.16
Nodes (26): Fab(), ArchiveIcon(), base, BudgetIcon(), CashIcon(), ChevronRight(), ClearIcon(), ContractIcon() (+18 more)

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
Nodes (30): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD (+22 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.15
Nodes (20): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), EncryptedRepository, vault, VaultSession, greetingText(), Bytes, ERR_PASSKEY_CANCELLED (+12 more)

### Community 17 - "FinanceApi"
Cohesion: 0.08
Nodes (4): ContractBookingInput, InvoiceInput, TransferInput, FinanceApi

### Community 18 - "exportSheet.ts"
Cohesion: 0.05
Nodes (70): out(), pan(), svg(), ImportSource, ALL_TIME, bookingLines(), buildExportSheets(), countExportRows() (+62 more)

### Community 19 - "importRows.ts"
Cohesion: 0.09
Nodes (47): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), resolveExportRange(), CASH_WORDS (+39 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.24
Nodes (11): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+3 more)

### Community 21 - "crypto.ts"
Cohesion: 0.17
Nodes (23): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), decodeBackupFile(), Bytes, decryptJSON(), encryptJSON(), ENVELOPE_FORMAT, ENVELOPE_VERSION, generateDataKey() (+15 more)

### Community 22 - "createVault"
Cohesion: 0.18
Nodes (21): createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot(), saveData() (+13 more)

### Community 23 - "AppData"
Cohesion: 0.15
Nodes (16): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+8 more)

### Community 24 - "dates.ts"
Cohesion: 0.16
Nodes (24): BalanceChart, monotonePath(), BudgetItem, BudgetTotal, monthBudgets, percentOf(), item(), UnbudgetedSpending (+16 more)

### Community 25 - "vitest"
Cohesion: 0.16
Nodes (15): vitest, CategorySum, categorySums(), compareTransactionsDesc(), RangeTotals, summarizeRange(), base(), MonthCategorySum (+7 more)

### Community 26 - "LedgerList.tsx"
Cohesion: 0.16
Nodes (17): RepeatIcon(), SwapIcon(), LedgerList, TransferRow, TransactionList, TransactionRow, amountText(), groupByMonth() (+9 more)

### Community 27 - "MonthPage.tsx"
Cohesion: 0.25
Nodes (17): BudgetBar(), ChevronLeft(), budgetStatus, monthLabel(), eur, formatCents(), formatDelta(), formatPercent() (+9 more)

### Community 29 - "defaults.ts"
Cohesion: 0.16
Nodes (19): mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS (+11 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.17
Nodes (18): STORAGE_KEY, Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure() (+10 more)

### Community 31 - "App.tsx"
Cohesion: 0.14
Nodes (16): AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf(), SubView, tabOf() (+8 more)

### Community 32 - "Kind"
Cohesion: 0.16
Nodes (10): ContractBooking, ImportRow, LedgerOptions, RecurringSuggestion, Account, Interval, Kind, ImportBooking (+2 more)

### Community 33 - "isValidISODate"
Cohesion: 0.21
Nodes (15): isValidISODate(), addInvoice(), addRecurring(), cleanNote(), createRecurringFromSuggestion(), importTransactions(), ruleFields(), updateInvoice() (+7 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.22
Nodes (3): AutoLockMinutes, LockApi, LockContext

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `domain/types.ts`, `actions.ts`, `FinanceContext.tsx`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `LockProvider.tsx`, `exportSheet.ts`, `importRows.ts`, `crypto.ts`, `dates.ts`, `LedgerList.tsx`, `MonthPage.tsx`, `defaults.ts`, `vault.test.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `domain/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07963963963963964 - nodes in this community are weakly interconnected._
- **Why does `Regeln` connect `gesture.ts` to `domain/types.ts`, `actions.ts`, `Kind`, `FinanceContext.tsx`, `smoke.mjs`, `recurringDetect.ts`, `FinanceApi`, `AppData`, `dates.ts`, `vitest`, `LedgerList.tsx`, `App.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Backlog (nicht in v1)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13709677419354838 - nodes in this community are weakly interconnected._