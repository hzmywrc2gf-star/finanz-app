# Graph Report - finanz-app  (2026-11-16)

## Corpus Check
- 171 files · ~154,307 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 3, (none) 2, .ics 2)

## Summary
- 1407 nodes · 4796 edges · 61 communities (58 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 238 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86bc3cc1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/backupReminder.ts
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- Sheet
- package.json
- smoke.mjs
- recurringDetect.ts
- deploy.yml
- gesture.ts
- todayISO
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
- haptic
- crypto.ts
- ics.ts
- recurring.ts
- StartPage.tsx
- LockScreen.tsx
- LedgerList.tsx
- importMapping.ts
- TransactionForm.tsx
- vault.test.ts
- AppData
- Kind
- vaultBackup.ts
- LockContext.ts
- ExcelPage.tsx
- App.tsx
- CategoryManager.tsx
- ExcelPage.tsx
- Transaction
- AppData
- CalendarImport.tsx
- zip.ts
- createRecurringFromSuggestion
- icsRead.ts
- Prüfen
- calendar.ts
- defaults.ts
- CalendarPage.tsx
- MonthGrid.tsx
- BudgetPage.tsx
- write.ts
- openStartPage
- bodyText
- seed
- monthStart
- MonthPage.tsx
- Projektkontext: finanz-app („Finanzklar“)
- vitest
- csv.ts
- ref_node_fs

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 70 edges
2. `useFinance()` - 69 edges
3. `react` - 63 edges
4. `Regeln` - 56 edges
5. `Architektur` - 55 edges
6. `AppData` - 53 edges
7. `todayISO()` - 52 edges
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

## Communities (61 total, 3 thin omitted)

### Community 0 - "lib/backupReminder.ts"
Cohesion: 0.18
Nodes (20): BackupCardBody(), BackupReminderCard(), CloudUpIcon(), backupDue(), month(), useBackupSettings(), BACKUP_REMINDER_KEY, BACKUP_SNOOZE_KEY (+12 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (50): isLocalDateTime(), addCategory(), addEvent(), addInvoice(), AddRecurringOptions, addTransaction(), bookNextNow(), bookOccurrence() (+42 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "Sheet"
Cohesion: 0.15
Nodes (28): BudgetForm(), save(), submit(), FinanceEntrySheet(), InvoiceAmountSheet(), submit(), InvoiceDetailSheet(), submit() (+20 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.09
Nodes (9): { chromium, devices }, deks, errors, futter, futterText, json, rawNewContext, swipe() (+1 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.18
Nodes (21): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+13 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.05
Nodes (98): Architektur, Regeln, react-dom, App(), NavStack(), Phase, zoomProgress(), SwipePane() (+90 more)

### Community 9 - "todayISO"
Cohesion: 0.14
Nodes (32): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), BackupExportSheet(), submit(), ConfirmDialog(), errMsg(), LockSetupScreen(), addFaceId(), applyRestored() (+24 more)

### Community 10 - "perf.mjs"
Cohesion: 0.12
Nodes (28): center(), { chromium, devices }, errors, gesture(), mainScenarios(), mainThread, metrics(), must() (+20 more)

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
Nodes (50): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), createVault(), encryptData(), extractableDek(), info() (+42 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.18
Nodes (20): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), VaultSession, greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput() (+12 more)

### Community 17 - "FinanceApi"
Cohesion: 0.06
Nodes (9): RecurringSuggestion, Interval, TransferDirection, ContractBookingInput, EventInput, InvoiceInput, RecurringInput, TransferInput (+1 more)

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.12
Nodes (30): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), CASH_WORDS, categoryKey(), cellToString(), duplicateKey(), excelSerialToISO(), EXPENSE_WORDS, findCategory() (+22 more)

### Community 20 - "haptic"
Cohesion: 0.16
Nodes (18): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+10 more)

### Community 21 - "crypto.ts"
Cohesion: 0.14
Nodes (26): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), wrapSlot(), Bytes, decryptJSON(), encryptJSON() (+18 more)

### Community 22 - "ics.ts"
Cohesion: 0.24
Nodes (15): exportIcs(), buildEventIcs(), buildIcs(), dateStamp(), dateTimeStamp(), escapeIcsText(), foldIcsLine(), FREQ_CODES (+7 more)

### Community 23 - "recurring.ts"
Cohesion: 0.17
Nodes (20): bookDue(), ContractsSummary, daysInMonth(), firstStep(), INTERVAL_LABELS, monthIndex(), monthlyEquivalent(), monthlyEquivalentOf() (+12 more)

### Community 24 - "StartPage.tsx"
Cohesion: 0.06
Nodes (71): Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), Fab(), ArchiveIcon(), base, BudgetIcon(), CalendarIcon(), CashIcon(), CheckIcon() (+63 more)

### Community 25 - "LockScreen.tsx"
Cohesion: 0.20
Nodes (12): AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen(), submit() (+4 more)

### Community 26 - "LedgerList.tsx"
Cohesion: 0.14
Nodes (15): SwapIcon(), TransferRow, base(), amountText(), groupByMonth(), ledgerEntries(), LedgerEntry, LedgerMonth (+7 more)

### Community 27 - "importMapping.ts"
Cohesion: 0.20
Nodes (16): ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), ColumnMapping, detectHeader(), guessMapping() (+8 more)

### Community 29 - "TransactionForm.tsx"
Cohesion: 0.29
Nodes (12): RecurringForm(), RecurringManager(), nextLabel(), PILL_SPRING, SegmentedControl(), Switch(), TransactionForm(), formatDateDE() (+4 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.37
Nodes (12): fail(), isAccount(), isDirection(), isInterval(), isKind(), isLocalDateTime(), isObj(), MAX_NAME_LENGTH (+4 more)

### Community 32 - "Kind"
Cohesion: 0.29
Nodes (7): AddPreset, ContractBooking, ImportRow, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "vaultBackup.ts"
Cohesion: 0.20
Nodes (13): VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope(), makeBackup() (+5 more)

### Community 35 - "ExcelPage.tsx"
Cohesion: 0.22
Nodes (16): ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName(), ExportMode, ExportRange, Line (+8 more)

### Community 36 - "App.tsx"
Cohesion: 0.12
Nodes (36): react, AppContent(), CALENDAR_SUBS, CalendarView, eventFormProps(), FormState, Nav, SETTINGS_SUBS (+28 more)

### Community 37 - "CategoryManager.tsx"
Cohesion: 0.39
Nodes (8): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), Category, countRecurringInCategory(), countTransactionsInCategory()

### Community 38 - "ExcelPage.tsx"
Cohesion: 0.28
Nodes (11): plural(), RecurringSuggestions(), never(), dismissKey(), getDismissedKeys(), RECURRING_DISMISSED_KEY, ContractsPage, ExcelPage (+3 more)

### Community 39 - "Transaction"
Cohesion: 0.24
Nodes (12): CategorySum, categorySums(), compareTransactionsDesc(), RangeTotals, summarizeRange(), MonthCategorySum, MonthPoint, monthSummary (+4 more)

### Community 40 - "AppData"
Cohesion: 0.13
Nodes (13): EncryptedRepository, LocalStorageRepository, STORAGE_KEY, isObj(), migrate(), FinanceRepository, vault, AppData (+5 more)

### Community 41 - "CalendarImport.tsx"
Cohesion: 0.16
Nodes (19): CalendarImportSheet(), onFile(), EventImportPreview(), run(), plural(), readCalendar(), importKey(), recurrenceText() (+11 more)

### Community 42 - "zip.ts"
Cohesion: 0.24
Nodes (12): CentralEntry, crc32(), CRC_TABLE, encoder, inflateRaw(), MAX_ENTRY_BYTES, readCentral(), readZip() (+4 more)

### Community 43 - "createRecurringFromSuggestion"
Cohesion: 0.67
Nodes (4): createRecurringFromSuggestion(), ruleFields(), updateRecurring(), validateRecurringInput()

### Community 44 - "icsRead.ts"
Cohesion: 0.12
Nodes (28): BYDAY, cut(), ERR_NOT_ICS, formatters, get(), IcsTime, instantToLocal(), p2() (+20 more)

### Community 45 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 46 - "calendar.ts"
Cohesion: 0.13
Nodes (39): start(), EventSheet(), changeStart(), submit(), toggleAllDay(), recurrenceFrom(), REPEAT_OPTIONS, RepeatChoice (+31 more)

### Community 47 - "defaults.ts"
Cohesion: 0.17
Nodes (17): EV, mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData() (+9 more)

### Community 48 - "CalendarPage.tsx"
Cohesion: 0.15
Nodes (32): Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen), DayList(), MonthGrid, dayMonthLabel(), DaySegment, daySegments(), financeEntries(), FinanceEntry (+24 more)

### Community 49 - "MonthGrid.tsx"
Cohesion: 0.17
Nodes (11): EventSheetProps, dayLabel(), MONTH_NAMES, plural(), RING_SPRING, GridDay, Occurrence, WEEKDAY_LONG (+3 more)

### Community 50 - "BudgetPage.tsx"
Cohesion: 0.24
Nodes (12): BudgetBar(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), item(), UnbudgetedSpending (+4 more)

### Community 51 - "write.ts"
Cohesion: 0.31
Nodes (10): WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder, escapeXml(), excelSerial() (+2 more)

### Community 52 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 53 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 54 - "seed"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 55 - "monthStart"
Cohesion: 0.34
Nodes (11): BalanceChart, monotonePath(), addMonths(), monthEnd(), monthShort(), monthStart(), balanceHistory(), BalancePoint (+3 more)

### Community 56 - "MonthPage.tsx"
Cohesion: 0.38
Nodes (9): RepeatIcon(), TransactionList, TransactionRow, monthLabel(), axisLabel(), CompareRow(), MonthPage, pointText() (+1 more)

### Community 57 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.29
Nodes (6): Alle Daten löschen (Einstellungen → Datensicherung → „Neu anfangen“), Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack

### Community 58 - "vitest"
Cohesion: 0.40
Nodes (4): vitest, isAppleTouchWebKit(), NavigatorInfo, USE_HISTORY

### Community 59 - "csv.ts"
Cohesion: 0.30
Nodes (10): DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter(), parseCsv(), parseCsvText(), isOldExcel() (+2 more)

### Community 60 - "ref_node_fs"
Cohesion: 0.60
Nodes (3): out(), pan(), svg()

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 343 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppData` connect `AppData` to `actions.ts`, `recurringDetect.ts`, `gesture.ts`, `todayISO`, `vault.ts`, `LockProvider.tsx`, `FinanceApi`, `crypto.ts`, `recurring.ts`, `StartPage.tsx`, `LedgerList.tsx`, `vault.test.ts`, `AppData`, `vaultBackup.ts`, `LockContext.ts`, `ExcelPage.tsx`, `App.tsx`, `Transaction`, `calendar.ts`, `defaults.ts`, `BudgetPage.tsx`, `monthStart`, `Projektkontext: finanz-app („Finanzklar“)`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09200603318250378 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `lib/backupReminder.ts`, `actions.ts`, `Sheet`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `importRows.ts`, `haptic`, `crypto.ts`, `ics.ts`, `recurring.ts`, `StartPage.tsx`, `LockScreen.tsx`, `LedgerList.tsx`, `importMapping.ts`, `vault.test.ts`, `vaultBackup.ts`, `ExcelPage.tsx`, `ExcelPage.tsx`, `Transaction`, `zip.ts`, `icsRead.ts`, `calendar.ts`, `defaults.ts`, `CalendarPage.tsx`, `write.ts`, `monthStart`, `csv.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06906906906906907 - nodes in this community are weakly interconnected._