# Graph Report - finanz-app  (2026-11-16)

## Corpus Check
- 169 files · ~149,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 3, (none) 2, .ics 2)

## Summary
- 1384 nodes · 4711 edges · 56 communities (54 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3166c5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createVault
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- StartPage.tsx
- package.json
- smoke.mjs
- recurringDetect.ts
- deploy.yml
- gesture.ts
- react
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
- Regeln
- crypto.ts
- ics.ts
- CalendarEvent
- dates.ts
- Icons.tsx
- LedgerList.tsx
- importMapping.ts
- Sheet
- vault.test.ts
- AppData
- Kind
- vaultBackup.ts
- LockContext.ts
- ExcelPage.tsx
- App.tsx
- useFinance
- theme.ts
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
- addDays
- write.ts
- openStartPage
- bodyText
- seed
- csv.ts

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 70 edges
2. `useFinance()` - 69 edges
3. `react` - 63 edges
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

## Communities (56 total, 2 thin omitted)

### Community 0 - "createVault"
Cohesion: 0.20
Nodes (19): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot() (+11 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (49): isLocalDateTime(), addCategory(), addEvent(), addInvoice(), AddRecurringOptions, addTransfer(), bookNextNow(), bookOccurrence() (+41 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.06
Nodes (92): Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), BudgetForm(), save(), submit(), ConfirmDialog(), FinanceEntrySheet(), CheckIcon(), ReceiptIcon() (+84 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

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
Nodes (41): Axis, EDGE_PX, FLICK_MIN_PX, FLICK_VELOCITY, FOLLOW_RAMP_PX, followOffset(), gestureIntent(), Intent (+33 more)

### Community 9 - "react"
Cohesion: 0.05
Nodes (83): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), react, AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL (+75 more)

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
Cohesion: 0.09
Nodes (26): b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD, ERR_RECOVERY (+18 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.17
Nodes (18): Greeting(), VaultSession, vaultBackupFileName(), greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput() (+10 more)

### Community 17 - "FinanceApi"
Cohesion: 0.06
Nodes (8): RecurringSuggestion, Interval, ContractBookingInput, EventInput, InvoiceInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.12
Nodes (34): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), initialMapping(), CASH_WORDS, categoryKey(), cellToString(), detectHeader(), duplicateKey(), excelSerialToISO() (+26 more)

### Community 20 - "Regeln"
Cohesion: 0.20
Nodes (27): Architektur, Regeln, react-dom, lerp(), NavStack(), Phase, ZoomGeometry, SwipePane() (+19 more)

### Community 21 - "crypto.ts"
Cohesion: 0.15
Nodes (28): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), kdfSlotFor(), wrapSlot(), Bytes, bytesToBase64(), decryptBytes(), decryptJSON(), deriveKeyFromPassword() (+20 more)

### Community 22 - "ics.ts"
Cohesion: 0.26
Nodes (14): buildEventIcs(), buildIcs(), dateStamp(), dateTimeStamp(), escapeIcsText(), foldIcsLine(), FREQ_CODES, IcsReminder (+6 more)

### Community 23 - "CalendarEvent"
Cohesion: 0.40
Nodes (4): EventSheetProps, Occurrence, CalendarEvent, ParsedIcs

### Community 24 - "dates.ts"
Cohesion: 0.06
Nodes (67): BalanceChart, monotonePath(), BudgetBar(), ChevronLeft(), HeaderAction, LargeTitleHeader(), BudgetItem, budgetStatus (+59 more)

### Community 25 - "Icons.tsx"
Cohesion: 0.19
Nodes (23): ArchiveIcon(), base, BudgetIcon(), CalendarIcon(), CashIcon(), ChevronRight(), ContractIcon(), HomeIcon() (+15 more)

### Community 26 - "LedgerList.tsx"
Cohesion: 0.17
Nodes (21): ClearIcon(), SearchIcon(), SwapIcon(), LedgerList, TransferRow, TransferForm(), amountText(), groupByMonth() (+13 more)

### Community 27 - "importMapping.ts"
Cohesion: 0.21
Nodes (12): ImportSheet(), changeSheet(), submit(), plural(), ColumnMapping, IMPORT_FIELDS, getSavedMapping(), IMPORT_MAPPING_KEY (+4 more)

### Community 29 - "Sheet"
Cohesion: 0.19
Nodes (20): PILL_SPRING, Sheet(), rubberBand(), SHEET_PULL_UP_PX, isSettled(), MAX_FRAME_S, MAX_STEP_S, REST_OFFSET_PX (+12 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.33
Nodes (13): fail(), isAccount(), isDirection(), isInterval(), isKind(), isLocalDateTime(), isObj(), MAX_NAME_LENGTH (+5 more)

### Community 32 - "Kind"
Cohesion: 0.25
Nodes (8): AddPreset, ContractBooking, ImportRow, LedgerOptions, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "vaultBackup.ts"
Cohesion: 0.19
Nodes (13): STORAGE_KEY, VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope() (+5 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.18
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 35 - "ExcelPage.tsx"
Cohesion: 0.17
Nodes (23): ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName(), ExportMode, ExportRange, Line (+15 more)

### Community 36 - "App.tsx"
Cohesion: 0.11
Nodes (20): AppContent(), CALENDAR_SUBS, CalendarView, eventFormProps(), FormState, Nav, SETTINGS_SUBS, START_SUBS (+12 more)

### Community 37 - "useFinance"
Cohesion: 0.24
Nodes (16): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), SaveError(), SegmentedControl(), SubPageHeader() (+8 more)

### Community 38 - "theme.ts"
Cohesion: 0.20
Nodes (11): App(), useThemePref(), applyTheme(), CHROME_COLOR, getThemePref(), PREFS, resolveTheme(), setThemePref() (+3 more)

### Community 39 - "Transaction"
Cohesion: 0.19
Nodes (10): RepeatIcon(), TransactionList, TransactionRow, accountBalance(), categorySums(), RangeTotals, totalBalance(), base() (+2 more)

### Community 40 - "AppData"
Cohesion: 0.14
Nodes (12): EncryptedRepository, LocalStorageRepository, isObj(), migrate(), FinanceRepository, vault, AppData, EventFreq (+4 more)

### Community 41 - "CalendarImport.tsx"
Cohesion: 0.27
Nodes (11): CalendarImportSheet(), onFile(), EventImportPreview(), run(), plural(), readCalendar(), importKey(), recurrenceText() (+3 more)

### Community 42 - "zip.ts"
Cohesion: 0.24
Nodes (12): CentralEntry, crc32(), CRC_TABLE, encoder, inflateRaw(), MAX_ENTRY_BYTES, readCentral(), readZip() (+4 more)

### Community 43 - "createRecurringFromSuggestion"
Cohesion: 0.67
Nodes (4): createRecurringFromSuggestion(), ruleFields(), updateRecurring(), validateRecurringInput()

### Community 44 - "icsRead.ts"
Cohesion: 0.11
Nodes (29): EventRecurrence, BYDAY, cut(), ERR_NOT_ICS, formatters, get(), IcsTime, instantToLocal() (+21 more)

### Community 45 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 46 - "calendar.ts"
Cohesion: 0.16
Nodes (24): compareOccurrences(), daySegments(), daysInMonth(), daysWithEvents(), financeEntries(), FinanceEntryType, generateDates(), makeOccurrence() (+16 more)

### Community 47 - "defaults.ts"
Cohesion: 0.13
Nodes (21): EV, mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData() (+13 more)

### Community 48 - "CalendarPage.tsx"
Cohesion: 0.22
Nodes (21): Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen), DayList(), Fab(), PlusIcon(), dayMonthLabel(), DaySegment, FinanceEntry, layoutDay() (+13 more)

### Community 49 - "MonthGrid.tsx"
Cohesion: 0.28
Nodes (8): dayLabel(), MONTH_NAMES, MonthGrid, plural(), RING_SPRING, GridDay, WEEKDAY_LONG, WEEKDAY_SHORT

### Community 50 - "addDays"
Cohesion: 0.24
Nodes (17): start(), EventSheet(), changeStart(), exportIcs(), submit(), toggleAllDay(), recurrenceFrom(), REPEAT_OPTIONS (+9 more)

### Community 51 - "write.ts"
Cohesion: 0.36
Nodes (9): WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder, escapeXml(), excelSerial() (+1 more)

### Community 52 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 53 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 54 - "seed"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 59 - "csv.ts"
Cohesion: 0.25
Nodes (10): out(), pan(), svg(), DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter() (+2 more)

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 342 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppData` connect `AppData` to `vaultBackup.ts`, `actions.ts`, `ExcelPage.tsx`, `StartPage.tsx`, `LockContext.ts`, `recurringDetect.ts`, `Transaction`, `react`, `calendar.ts`, `vault.ts`, `defaults.ts`, `FinanceApi`, `LockProvider.tsx`, `Regeln`, `dates.ts`, `LedgerList.tsx`, `vault.test.ts`, `AppData`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `StartPage.tsx`, `package.json`, `gesture.ts`, `LockProvider.tsx`, `Regeln`, `dates.ts`, `Icons.tsx`, `LedgerList.tsx`, `importMapping.ts`, `Sheet`, `LockContext.ts`, `ExcelPage.tsx`, `App.tsx`, `useFinance`, `theme.ts`, `Transaction`, `CalendarImport.tsx`, `CalendarPage.tsx`, `MonthGrid.tsx`, `addDays`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Projektkontext: finanz-app („Finanzklar“)` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._