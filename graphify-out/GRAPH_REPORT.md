# Graph Report - finanz-app  (2026-10-29)

## Corpus Check
- 146 files · ~118,939 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 1)

## Summary
- 1152 nodes · 3739 edges · 42 communities (39 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 185 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f99162b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- vitest
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- FinanceContext.tsx
- package.json
- smoke.mjs
- recurringDetect.ts
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
- FinanceApi
- exportSheet.ts
- importRows.ts
- LockScreen.tsx
- crypto.ts
- createVault
- AppData
- dates.ts
- LargeTitleHeader.tsx
- recurring.ts
- budget.test.ts
- domain/types.ts
- vault.test.ts
- AppData
- Kind
- isValidISODate
- LockContext.ts
- csv.ts
- Prüfen
- BalanceChart.tsx
- openStartPage
- bodyText
- CategoryManager.tsx
- openSettings

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 57 edges
2. `useFinance()` - 57 edges
3. `Regeln` - 55 edges
4. `react` - 54 edges
5. `Architektur` - 48 edges
6. `AppData` - 45 edges
7. `StartPage` - 43 edges
8. `todayISO()` - 40 edges
9. `vitest` - 33 edges
10. `Sheet()` - 33 edges

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

## Communities (42 total, 3 thin omitted)

### Community 0 - "vitest"
Cohesion: 0.12
Nodes (24): RFC-5545, vitest, DEFAULT_DUE_DAYS, defaultDueDate(), dueInvoices(), invoiceReminderDate(), REMINDER_DAYS, snoozeDate() (+16 more)

### Community 1 - "actions.ts"
Cohesion: 0.12
Nodes (36): tx(), addCategory(), AddRecurringOptions, addTransaction(), bookNextNow(), bookOccurrence(), changeInvoiceAmount(), confirmOccurrence() (+28 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 3 - "FinanceContext.tsx"
Cohesion: 0.06
Nodes (107): Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), react, AppContent(), AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES (+99 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.09
Nodes (8): { chromium, devices }, deks, errors, futter, futterText, json, swipe(), swipeRow()

### Community 6 - "recurringDetect.ts"
Cohesion: 0.19
Nodes (20): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+12 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.06
Nodes (81): Architektur, Regeln, react-dom, App(), NavStack(), Phase, SwipePane(), SwipeRow() (+73 more)

### Community 9 - "App.tsx"
Cohesion: 0.06
Nodes (79): FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf(), SubView, tabOf(), BudgetBar() (+71 more)

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
Nodes (29): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD (+21 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.17
Nodes (19): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), VaultSession, greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput() (+11 more)

### Community 17 - "FinanceApi"
Cohesion: 0.07
Nodes (7): RecurringSuggestion, Interval, ContractBookingInput, InvoiceInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "exportSheet.ts"
Cohesion: 0.06
Nodes (54): out(), pan(), svg(), ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName() (+46 more)

### Community 19 - "importRows.ts"
Cohesion: 0.09
Nodes (49): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), ImportSheet(), changeSheet(), submit(), ImportSource, initialMapping(), plural(), CASH_WORDS (+41 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.27
Nodes (9): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+1 more)

### Community 21 - "crypto.ts"
Cohesion: 0.14
Nodes (27): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), exportEncrypted(), Bytes, decryptBytes(), decryptJSON() (+19 more)

### Community 22 - "createVault"
Cohesion: 0.18
Nodes (21): createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot(), saveData() (+13 more)

### Community 23 - "AppData"
Cohesion: 0.26
Nodes (12): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+4 more)

### Community 24 - "dates.ts"
Cohesion: 0.23
Nodes (19): CategorySum, compareTransactionsDesc(), summarizeRange(), addDays(), addMonths(), addYears(), monthEnd(), MONTHS (+11 more)

### Community 25 - "LargeTitleHeader.tsx"
Cohesion: 0.15
Nodes (18): HeaderAction, barProgress(), clamp01(), GLOW_END_PX, GLOW_LAG, glowOffset(), HERO_SHIFT_DIV, TITLE_COLLAPSE_PX (+10 more)

### Community 26 - "recurring.ts"
Cohesion: 0.18
Nodes (20): bookDue(), ContractsSummary, daysInMonth(), firstStep(), INTERVAL_LABELS, monthIndex(), monthlyEquivalent(), monthlyEquivalentOf() (+12 more)

### Community 27 - "budget.test.ts"
Cohesion: 0.31
Nodes (8): budgetAlerts(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), item(), UnbudgetedSpending

### Community 29 - "domain/types.ts"
Cohesion: 0.11
Nodes (21): withBudget(), accountBalance(), categorySums(), RangeTotals, totalBalance(), builtInId(), createDefaultCategories(), createDefaultData() (+13 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.17
Nodes (18): STORAGE_KEY, Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure() (+10 more)

### Community 31 - "AppData"
Cohesion: 0.18
Nodes (7): EncryptedRepository, LocalStorageRepository, FinanceRepository, vault, AppData, ImportResult, PayInvoiceResult

### Community 32 - "Kind"
Cohesion: 0.27
Nodes (7): AddPreset, ContractBooking, LedgerOptions, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "isValidISODate"
Cohesion: 0.21
Nodes (16): mutate(), sample(), isValidISODate(), addInvoice(), addRecurring(), addTransfer(), cleanNote(), createRecurringFromSuggestion() (+8 more)

### Community 35 - "csv.ts"
Cohesion: 0.30
Nodes (10): DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter(), parseCsv(), parseCsvText(), isOldExcel() (+2 more)

### Community 36 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 37 - "BalanceChart.tsx"
Cohesion: 0.42
Nodes (7): BalanceChart, monotonePath(), monthShort(), balanceHistory(), BalancePoint, hasHistory(), formatWholeEuros()

### Community 38 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 39 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 40 - "CategoryManager.tsx"
Cohesion: 0.46
Nodes (7): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), countRecurringInCategory(), countTransactionsInCategory()

### Community 41 - "openSettings"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 292 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Regeln` connect `gesture.ts` to `vitest`, `actions.ts`, `Projektkontext: finanz-app („Finanzklar“)`, `FinanceContext.tsx`, `BalanceChart.tsx`, `openStartPage`, `recurringDetect.ts`, `App.tsx`, `FinanceApi`, `dates.ts`, `LargeTitleHeader.tsx`, `recurring.ts`, `AppData`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `isValidISODate`, `actions.ts`, `csv.ts`, `package.json`, `FinanceContext.tsx`, `recurringDetect.ts`, `gesture.ts`, `App.tsx`, `LockProvider.tsx`, `exportSheet.ts`, `importRows.ts`, `crypto.ts`, `dates.ts`, `LargeTitleHeader.tsx`, `recurring.ts`, `budget.test.ts`, `domain/types.ts`, `vault.test.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11948790896159317 - nodes in this community are weakly interconnected._