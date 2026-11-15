# Graph Report - finanz-app  (2026-11-15)

## Corpus Check
- 167 files · ~143,446 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 3, (none) 2, .ics 2)

## Summary
- 1360 nodes · 4600 edges · 61 communities (59 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 220 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f51fa402`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- todayISO
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- StartPage.tsx
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
- read.ts
- importRows.ts
- LockScreen.tsx
- crypto.ts
- Transaction
- ExcelPage.tsx
- dates.ts
- Icons.tsx
- lib/backupReminder.ts
- ImportSheet.tsx
- defaults.ts
- vault.test.ts
- AppData
- ledger.ts
- vaultBackup.ts
- LockContext.ts
- csv.ts
- Prüfen
- AppLockSettings.tsx
- openStartPage
- bodyText
- AppData
- openSettings
- zip.ts
- isValidISODate
- icsRead.ts
- RecurringSuggestions.tsx
- calendar.ts
- domain/types.ts
- CalendarPage.tsx
- MonthPage.tsx
- addDays
- write.ts
- CalendarImport.tsx
- FinanceContext.tsx
- ConfirmDialog
- LedgerList.tsx
- calendar.test.ts
- RecurringSuggestion
- bookNextNow
- ref_node_fs
- platform.ts

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 69 edges
2. `haptic()` - 66 edges
3. `react` - 62 edges
4. `Regeln` - 55 edges
5. `Architektur` - 53 edges
6. `todayISO()` - 52 edges
7. `AppData` - 52 edges
8. `addDays()` - 44 edges
9. `StartPage` - 44 edges
10. `Sheet()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen)` --references--> `start()`  [INFERRED]
  CLAUDE.md → e2e/perf.mjs
- `Regeln` --references--> `balance()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `withVault()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `keepAlive()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs

## Import Cycles
- None detected.

## Communities (61 total, 2 thin omitted)

### Community 0 - "todayISO"
Cohesion: 0.18
Nodes (25): BudgetForm(), save(), submit(), FinanceEntrySheet(), InvoiceAmountSheet(), submit(), PayInvoiceSheet(), submit() (+17 more)

### Community 1 - "actions.ts"
Cohesion: 0.13
Nodes (30): addCategory(), addEvent(), AddRecurringOptions, changeInvoiceAmount(), deleteCategory(), deleteEvent(), deleteInvoice(), deleteRecurring() (+22 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.08
Nodes (61): Architektur, Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), ReceiptIcon(), InvoiceDetailSheet(), InvoiceFlow, InvoiceFlowDialogs(), InvoiceListSheet(), budgetAlerts() (+53 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.09
Nodes (9): { chromium, devices }, deks, errors, futter, futterText, json, rawNewContext, swipe() (+1 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.19
Nodes (20): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+12 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.08
Nodes (71): Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen), Regeln, react-dom, NavStack(), Phase, StackAnim, SwipePane(), SwipeRow() (+63 more)

### Community 9 - "App.tsx"
Cohesion: 0.15
Nodes (30): App(), AppContent(), CALENDAR_SUBS, CalendarView, eventFormProps(), FormState, Nav, SETTINGS_SUBS (+22 more)

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
Cohesion: 0.07
Nodes (48): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), createVault(), encryptData(), extractableDek(), info() (+40 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.13
Nodes (22): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), EncryptedRepository, vault, VaultSession, greetingText(), Bytes (+14 more)

### Community 17 - "FinanceApi"
Cohesion: 0.06
Nodes (7): EventRecurrence, TransferDirection, ContractBookingInput, EventInput, InvoiceInput, TransferInput, FinanceApi

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.11
Nodes (29): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), FALLBACK_NAME, resolveExportRange(), CASH_WORDS, categoryKey(), cellToString(), excelSerialToISO(), EXPENSE_WORDS (+21 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.19
Nodes (15): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+7 more)

### Community 21 - "crypto.ts"
Cohesion: 0.15
Nodes (28): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), Bytes, decryptBytes(), decryptJSON(), deriveKeyFromPassword() (+20 more)

### Community 22 - "Transaction"
Cohesion: 0.30
Nodes (11): CategorySum, categorySums(), compareTransactionsDesc(), RangeTotals, summarizeRange(), MonthCategorySum, MonthPoint, monthSummary (+3 more)

### Community 23 - "ExcelPage.tsx"
Cohesion: 0.14
Nodes (27): BackupExportSheet(), submit(), errMsg(), LockSetupScreen(), addFaceId(), applyRestored(), create(), exportPlain() (+19 more)

### Community 24 - "dates.ts"
Cohesion: 0.23
Nodes (17): BalanceChart, monotonePath(), addMonths(), addYears(), monthEnd(), MONTHS, MONTHS_SHORT, monthShort() (+9 more)

### Community 25 - "Icons.tsx"
Cohesion: 0.06
Nodes (60): ArchiveIcon(), base, BudgetIcon(), CalendarIcon(), CashIcon(), CheckIcon(), ChevronRight(), ClearIcon() (+52 more)

### Community 26 - "lib/backupReminder.ts"
Cohesion: 0.17
Nodes (21): BackupCardBody(), BackupReminderCard(), CloudUpIcon(), backupDue(), month(), useBackupSettings(), BACKUP_REMINDER_KEY, BACKUP_SNOOZE_KEY (+13 more)

### Community 27 - "ImportSheet.tsx"
Cohesion: 0.17
Nodes (19): ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), ColumnMapping, detectHeader(), duplicateKey() (+11 more)

### Community 29 - "defaults.ts"
Cohesion: 0.24
Nodes (12): EV, mutate(), sample(), item(), tx(), withBudget(), bookDue(), addRecurring() (+4 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.22
Nodes (16): fail(), isAccount(), isDirection(), isInterval(), isKind(), isLocalDateTime(), isObj(), MAX_NAME_LENGTH (+8 more)

### Community 32 - "ledger.ts"
Cohesion: 0.16
Nodes (14): ImportRow, amountText(), groupByMonth(), ledgerEntries(), LedgerEntry, LedgerMonth, LedgerOptions, matches() (+6 more)

### Community 33 - "vaultBackup.ts"
Cohesion: 0.20
Nodes (13): VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope(), makeBackup() (+5 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.18
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 35 - "csv.ts"
Cohesion: 0.30
Nodes (10): DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter(), parseCsv(), parseCsvText(), isOldExcel() (+2 more)

### Community 36 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 37 - "AppLockSettings.tsx"
Cohesion: 0.15
Nodes (21): react, AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet() (+13 more)

### Community 38 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 39 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 40 - "AppData"
Cohesion: 0.16
Nodes (13): FinanceRepository, bookingLines(), buildExportSheets(), countExportRows(), ExportMode, ExportRange, money(), monthRows() (+5 more)

### Community 41 - "openSettings"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 42 - "zip.ts"
Cohesion: 0.24
Nodes (12): CentralEntry, crc32(), CRC_TABLE, encoder, inflateRaw(), MAX_ENTRY_BYTES, readCentral(), readZip() (+4 more)

### Community 43 - "isValidISODate"
Cohesion: 0.18
Nodes (16): isLocalDateTime(), isValidISODate(), addInvoice(), cleanNote(), createRecurringFromSuggestion(), deleteOccurrence(), importTransactions(), ruleFields() (+8 more)

### Community 44 - "icsRead.ts"
Cohesion: 0.12
Nodes (28): BYDAY, cut(), ERR_NOT_ICS, formatters, get(), IcsTime, instantToLocal(), p2() (+20 more)

### Community 45 - "RecurringSuggestions.tsx"
Cohesion: 0.34
Nodes (9): plural(), RecurringSuggestions(), create(), never(), recurrenceLabel(), dismissKey(), getDismissedKeys(), RECURRING_DISMISSED_KEY (+1 more)

### Community 46 - "calendar.ts"
Cohesion: 0.12
Nodes (22): EventSheetProps, dayLabel(), MONTH_NAMES, MonthGrid, plural(), daysInMonth(), FinanceEntryType, generateDates() (+14 more)

### Community 47 - "domain/types.ts"
Cohesion: 0.12
Nodes (19): vitest, builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS, INCOME_DEFAULTS, ALL_TIME, plain() (+11 more)

### Community 48 - "CalendarPage.tsx"
Cohesion: 0.23
Nodes (19): DayList(), Fab(), PlusIcon(), dayMonthLabel(), DaySegment, financeEntries(), FinanceEntry, layoutDay() (+11 more)

### Community 49 - "MonthPage.tsx"
Cohesion: 0.20
Nodes (20): BudgetBar(), ChevronLeft(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), UnbudgetedSpending (+12 more)

### Community 50 - "addDays"
Cohesion: 0.22
Nodes (22): EventSheet(), changeStart(), exportIcs(), submit(), toggleAllDay(), recurrenceFrom(), REPEAT_OPTIONS, RepeatChoice (+14 more)

### Community 51 - "write.ts"
Cohesion: 0.26
Nodes (12): Line, WriteCell, WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder (+4 more)

### Community 52 - "CalendarImport.tsx"
Cohesion: 0.27
Nodes (11): CalendarImportSheet(), onFile(), EventImportPreview(), run(), plural(), readCalendar(), importKey(), recurrenceText() (+3 more)

### Community 53 - "FinanceContext.tsx"
Cohesion: 0.27
Nodes (9): AddPreset, ContractBooking, UNDO_MS, UndoToast(), Kind, TransactionInput, defaultRepo, FinanceContext (+1 more)

### Community 54 - "ConfirmDialog"
Cohesion: 0.38
Nodes (8): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), ConfirmDialog(), countRecurringInCategory(), countTransactionsInCategory()

### Community 55 - "LedgerList.tsx"
Cohesion: 0.44
Nodes (7): RepeatIcon(), SwapIcon(), TransferRow, TransactionList, TransactionRow, formatShortDay(), Category

### Community 56 - "calendar.test.ts"
Cohesion: 0.31
Nodes (7): compareOccurrences(), daySegments(), makeOccurrence(), occurrencesInRange(), occurrencesOnDay(), spanDays(), dates()

### Community 57 - "RecurringSuggestion"
Cohesion: 0.33
Nodes (3): RecurringSuggestion, Interval, RecurringInput

### Community 58 - "bookNextNow"
Cohesion: 0.47
Nodes (6): bookNextNow(), bookOccurrence(), confirmOccurrence(), findRule(), requireOldestPending(), skipOccurrence()

### Community 59 - "ref_node_fs"
Cohesion: 0.60
Nodes (3): out(), pan(), svg()

### Community 60 - "platform.ts"
Cohesion: 0.50
Nodes (3): isAppleTouchWebKit(), NavigatorInfo, USE_HISTORY

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 334 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `domain/types.ts` to `actions.ts`, `StartPage.tsx`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `LockProvider.tsx`, `crypto.ts`, `Transaction`, `dates.ts`, `Icons.tsx`, `lib/backupReminder.ts`, `ImportSheet.tsx`, `defaults.ts`, `vault.test.ts`, `ledger.ts`, `vaultBackup.ts`, `csv.ts`, `AppLockSettings.tsx`, `zip.ts`, `icsRead.ts`, `RecurringSuggestions.tsx`, `MonthPage.tsx`, `write.ts`, `calendar.test.ts`, `platform.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Why does `AppData` connect `AppData` to `actions.ts`, `StartPage.tsx`, `recurringDetect.ts`, `gesture.ts`, `vault.ts`, `LockProvider.tsx`, `FinanceApi`, `crypto.ts`, `Transaction`, `ExcelPage.tsx`, `dates.ts`, `defaults.ts`, `vault.test.ts`, `AppData`, `ledger.ts`, `vaultBackup.ts`, `LockContext.ts`, `AppLockSettings.tsx`, `calendar.ts`, `domain/types.ts`, `MonthPage.tsx`, `FinanceContext.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Projektkontext: finanz-app („Finanzklar“)` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._