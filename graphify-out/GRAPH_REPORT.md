# Graph Report - finanz-app  (2026-11-01)

## Corpus Check
- 156 files · ~125,705 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 1)

## Summary
- 1210 nodes · 3976 edges · 52 communities (49 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 202 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f955800`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recurring.ts
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- StartPage.tsx
- package.json
- smoke.mjs
- recurringDetect.ts
- deploy.yml
- gesture.ts
- domain/types.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- FinanceApi
- read.ts
- importRows.ts
- LockScreen.tsx
- crypto.ts
- Transaction
- todayISO
- dates.ts
- LargeTitleHeader.tsx
- lib/backupReminder.ts
- ImportSheet.tsx
- defaults.ts
- vault.test.ts
- AppData
- Kind
- vaultBackup.ts
- LockContext.ts
- csv.ts
- Prüfen
- AppLockSettings.tsx
- openStartPage
- bodyText
- exportSheet.ts
- openSettings
- zip.ts
- isValidISODate
- LockSetupScreen.tsx
- RecurringSuggestions.tsx
- LockSetupScreen
- vitest
- scripts
- budget.ts
- useVaultBackup.ts
- dependencies

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 60 edges
2. `useFinance()` - 59 edges
3. `react` - 57 edges
4. `Regeln` - 55 edges
5. `AppData` - 50 edges
6. `Architektur` - 49 edges
7. `todayISO()` - 46 edges
8. `StartPage` - 44 edges
9. `vitest` - 35 edges
10. `Sheet()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `balance()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `withVault()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `keepAlive()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` --references--> `seed()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs

## Import Cycles
- None detected.

## Communities (52 total, 3 thin omitted)

### Community 0 - "recurring.ts"
Cohesion: 0.13
Nodes (28): RecurringForm(), submit(), RecurringManager(), nextLabel(), create(), Switch(), formatDateDE(), bookDue() (+20 more)

### Community 1 - "actions.ts"
Cohesion: 0.13
Nodes (30): ids(), addCategory(), AddRecurringOptions, bookNextNow(), bookOccurrence(), changeInvoiceAmount(), confirmOccurrence(), deleteCategory() (+22 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.11
Nodes (53): Architektur, Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), RFC-5545, ConfirmDialog(), ReceiptIcon(), InvoiceAmountSheet(), submit(), InvoiceDetailSheet() (+45 more)

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (23): devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@~7.0.2, vite@^8.3.5 (+15 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (9): { chromium, devices }, deks, errors, futter, futterText, json, rawNewContext, swipe() (+1 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.18
Nodes (21): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+13 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.06
Nodes (82): Regeln, react-dom, App(), NavStack(), Phase, PILL_SPRING, Sheet(), SwipePane() (+74 more)

### Community 9 - "domain/types.ts"
Cohesion: 0.05
Nodes (108): react, AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf(), SubView (+100 more)

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
Nodes (30): b64(), Bytes, canonical(), extractableDek(), unlockWithPasskey(), DATA_AAD, DEFAULT_AUTO_LOCK, derivePasskeyKek() (+22 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.14
Nodes (22): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), EncryptedRepository, vault, VaultSession, vaultBackupFileName(), greetingText(), Bytes (+14 more)

### Community 17 - "FinanceApi"
Cohesion: 0.07
Nodes (7): RecurringSuggestion, Interval, ContractBookingInput, InvoiceInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.13
Nodes (29): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), CASH_WORDS, categoryKey(), cellToString(), duplicateKey(), excelSerialToISO(), EXPENSE_WORDS, findCategory() (+21 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.27
Nodes (9): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+1 more)

### Community 21 - "crypto.ts"
Cohesion: 0.11
Nodes (41): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), createVault(), encryptData(), info(), loadData(), loadRaw(), replaceSlot(), saveData() (+33 more)

### Community 22 - "Transaction"
Cohesion: 0.24
Nodes (12): CategorySum, categorySums(), compareTransactionsDesc(), RangeTotals, summarizeRange(), MonthCategorySum, MonthPoint, monthSummary (+4 more)

### Community 23 - "todayISO"
Cohesion: 0.27
Nodes (15): BackupExportSheet(), submit(), BackupImportSheet(), submit(), exportPlain(), VaultBackupImportSheet(), submit(), exportJSON() (+7 more)

### Community 24 - "dates.ts"
Cohesion: 0.23
Nodes (18): BalanceChart, monotonePath(), addDays(), addMonths(), addYears(), monthEnd(), MONTHS, MONTHS_SHORT (+10 more)

### Community 25 - "LargeTitleHeader.tsx"
Cohesion: 0.15
Nodes (20): HeaderAction, LargeTitleHeader(), barProgress(), clamp01(), GLOW_END_PX, GLOW_LAG, glowOffset(), HERO_SHIFT_DIV (+12 more)

### Community 26 - "lib/backupReminder.ts"
Cohesion: 0.18
Nodes (20): BackupCardBody(), BackupReminderCard(), CloudUpIcon(), backupDue(), month(), useBackupSettings(), BACKUP_REMINDER_KEY, BACKUP_SNOOZE_KEY (+12 more)

### Community 27 - "ImportSheet.tsx"
Cohesion: 0.19
Nodes (17): ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), ColumnMapping, detectHeader(), guessMapping() (+9 more)

### Community 29 - "defaults.ts"
Cohesion: 0.17
Nodes (18): mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS (+10 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.15
Nodes (15): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, validateAppData() (+7 more)

### Community 32 - "Kind"
Cohesion: 0.25
Nodes (8): AddPreset, ContractBooking, ImportRow, LedgerOptions, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "vaultBackup.ts"
Cohesion: 0.17
Nodes (14): STORAGE_KEY, VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope() (+6 more)

### Community 35 - "csv.ts"
Cohesion: 0.27
Nodes (10): out(), pan(), svg(), DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter() (+2 more)

### Community 36 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 37 - "AppLockSettings.tsx"
Cohesion: 0.17
Nodes (15): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+7 more)

### Community 38 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 39 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 40 - "exportSheet.ts"
Cohesion: 0.16
Nodes (24): ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName(), ExportMode, ExportRange, Line (+16 more)

### Community 41 - "openSettings"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 42 - "zip.ts"
Cohesion: 0.15
Nodes (21): WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder, escapeXml(), excelSerial() (+13 more)

### Community 43 - "isValidISODate"
Cohesion: 0.22
Nodes (14): isValidISODate(), addInvoice(), cleanNote(), createRecurringFromSuggestion(), importTransactions(), ruleFields(), updateInvoice(), updateRecurring() (+6 more)

### Community 44 - "LockSetupScreen.tsx"
Cohesion: 0.29
Nodes (8): Step, SUBTITLE, PasswordFields(), ERR_TOO_BIG, MAX_FILE_BYTES, MIN_PASSWORD_LENGTH, passwordStrength, STRENGTH_LABEL

### Community 45 - "RecurringSuggestions.tsx"
Cohesion: 0.36
Nodes (8): CheckIcon(), RefreshIcon(), plural(), RecurringSuggestions(), never(), dismissKey(), getDismissedKeys(), RECURRING_DISMISSED_KEY

### Community 46 - "LockSetupScreen"
Cohesion: 0.29
Nodes (11): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), errMsg(), LockSetupScreen(), addFaceId(), applyRestored(), create(), onRestoredJson(), onRestoreFile() (+3 more)

### Community 47 - "vitest"
Cohesion: 0.20
Nodes (6): vitest@^5.0.5, vitest, base(), isAppleTouchWebKit(), NavigatorInfo, USE_HISTORY

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, e2e, icons, lint, preview, test

### Community 49 - "budget.ts"
Cohesion: 0.29
Nodes (7): BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), item(), UnbudgetedSpending

### Community 50 - "useVaultBackup.ts"
Cohesion: 0.43
Nodes (5): BackupOutcome, useVaultBackup(), recordBackup(), downloadFile(), useLock()

### Community 51 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, react@^19.3.1, react-dom@^19.3.1

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 304 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `recurring.ts`, `actions.ts`, `StartPage.tsx`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `domain/types.ts`, `LockProvider.tsx`, `importRows.ts`, `crypto.ts`, `Transaction`, `dates.ts`, `LargeTitleHeader.tsx`, `lib/backupReminder.ts`, `ImportSheet.tsx`, `defaults.ts`, `vault.test.ts`, `vaultBackup.ts`, `csv.ts`, `exportSheet.ts`, `zip.ts`, `RecurringSuggestions.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recurring.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13277310924369748 - nodes in this community are weakly interconnected._
- **Why does `react` connect `domain/types.ts` to `recurring.ts`, `StartPage.tsx`, `package.json`, `AppLockSettings.tsx`, `gesture.ts`, `exportSheet.ts`, `LockSetupScreen.tsx`, `RecurringSuggestions.tsx`, `LockProvider.tsx`, `useVaultBackup.ts`, `dependencies`, `LockScreen.tsx`, `todayISO`, `dates.ts`, `LargeTitleHeader.tsx`, `lib/backupReminder.ts`, `ImportSheet.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13306451612903225 - nodes in this community are weakly interconnected._