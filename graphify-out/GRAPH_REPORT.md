# Graph Report - finanz-app  (2026-11-18)

## Corpus Check
- 187 files · ~172,752 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 3, (none) 2, .ics 2)

## Summary
- 1580 nodes · 5579 edges · 65 communities (63 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 272 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `392b64b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/backupReminder.ts
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- Sheet
- package.json
- smoke.mjs
- recurring.ts
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
- todos.ts
- Icons.tsx
- LockScreen.tsx
- dates.ts
- importMapping.ts
- StartPage.tsx
- vault.test.ts
- AppData
- Kind
- vaultBackup.ts
- LockContext.ts
- ExcelPage.tsx
- App.tsx
- CategoryManager.tsx
- TodoDetailSheet.tsx
- Architektur
- AppData
- CalendarImport.tsx
- write.ts
- createRecurringFromSuggestion
- icsRead.ts
- Prüfen
- calendar.ts
- defaults.ts
- CalendarPage.tsx
- MonthGrid.tsx
- spring.ts
- LargeTitleHeader
- openStartPage
- bodyText
- seed
- patchTodo
- theme.ts
- Projektkontext: finanz-app („Finanzklar“)
- EventSheet
- csv.ts
- useFinance
- pinch.test.ts
- TodayTodosCard.tsx
- CalendarEvent
- cleanListInput

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 84 edges
2. `haptic()` - 82 edges
3. `react` - 73 edges
4. `Architektur` - 67 edges
5. `todayISO()` - 63 edges
6. `Regeln` - 59 edges
7. `AppData` - 56 edges
8. `addDays()` - 54 edges
9. `Sheet()` - 50 edges
10. `FinanceApi` - 50 edges

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

## Communities (65 total, 2 thin omitted)

### Community 0 - "lib/backupReminder.ts"
Cohesion: 0.15
Nodes (24): BackupCardBody(), BackupReminderCard(), CloudUpIcon(), backupDue(), month(), useBackupSettings(), BackupOutcome, useVaultBackup() (+16 more)

### Community 1 - "actions.ts"
Cohesion: 0.08
Nodes (50): snoozeDate(), bookDue(), addCategory(), addEvent(), addInvoice(), AddRecurringOptions, addTransaction(), addTransfer() (+42 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "Sheet"
Cohesion: 0.18
Nodes (26): BudgetForm(), save(), submit(), FinanceEntrySheet(), PayInvoiceSheet(), submit(), RecurringForm(), submit() (+18 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.09
Nodes (9): { chromium, devices }, deks, errors, futter, futterText, json, rawNewContext, swipe() (+1 more)

### Community 6 - "recurring.ts"
Cohesion: 0.08
Nodes (50): CheckIcon(), RefreshIcon(), plural(), RecurringSuggestions(), create(), never(), ContractsSummary, daysInMonth() (+42 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.09
Nodes (34): Axis, BACK_FRACTION, EDGE_PX, FLICK_MIN_PX, FLICK_VELOCITY, FOLLOW_RAMP_PX, followOffset(), gestureIntent() (+26 more)

### Community 9 - "todayISO"
Cohesion: 0.16
Nodes (27): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), BackupExportSheet(), submit(), errMsg(), LockSetupScreen(), addFaceId(), applyRestored(), create() (+19 more)

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
Nodes (51): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), createVault(), encryptData(), extractableDek(), info() (+43 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.19
Nodes (17): Greeting(), recordSuccess(), greetingText(), Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput(), isPasskeyPrfLikelySupported() (+9 more)

### Community 17 - "FinanceApi"
Cohesion: 0.05
Nodes (8): EventRecurrence, ContractBookingInput, EventInput, InvoiceInput, TodoInput, TodoPatch, TransferInput, FinanceApi

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.13
Nodes (32): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), CASH_WORDS, categoryKey(), cellToString(), detectHeader(), duplicateKey(), excelSerialToISO(), EXPENSE_WORDS (+24 more)

### Community 20 - "haptic"
Cohesion: 0.14
Nodes (19): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+11 more)

### Community 21 - "crypto.ts"
Cohesion: 0.15
Nodes (25): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), BackupImportSheet(), submit(), decodeBackupFile(), Bytes, decryptJSON(), encryptJSON(), ENVELOPE_FORMAT (+17 more)

### Community 22 - "ics.ts"
Cohesion: 0.19
Nodes (18): buildEventIcs(), buildIcs(), dateStamp(), dateTimeStamp(), escapeIcsText(), foldIcsLine(), FREQ_CODES, IcsReminder (+10 more)

### Community 23 - "todos.ts"
Cohesion: 0.08
Nodes (40): MoreIcon(), TodoListSheet(), submit(), SMART_STYLE, compareDone(), compareOpen(), DEFAULT_LIST_NAME, importantTodos() (+32 more)

### Community 24 - "Icons.tsx"
Cohesion: 0.14
Nodes (36): ArchiveIcon(), base, BookIcon(), BudgetIcon(), CalendarIcon(), CartIcon(), CashIcon(), ChevronRight() (+28 more)

### Community 25 - "LockScreen.tsx"
Cohesion: 0.19
Nodes (15): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen() (+7 more)

### Community 26 - "dates.ts"
Cohesion: 0.06
Nodes (74): BalanceChart, monotonePath(), BudgetBar(), Fab(), ChevronLeft(), ClearIcon(), RepeatIcon(), SearchIcon() (+66 more)

### Community 27 - "importMapping.ts"
Cohesion: 0.20
Nodes (15): vitest, ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), ColumnMapping, headerSignature() (+7 more)

### Community 29 - "StartPage.tsx"
Cohesion: 0.19
Nodes (27): Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), ReceiptIcon(), InvoiceAmountSheet(), InvoiceDetailSheet(), InvoiceFlow, InvoiceFlowDialogs(), InvoiceListSheet(), accountBalance() (+19 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.21
Nodes (15): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), remainingWaitMs() (+7 more)

### Community 31 - "AppData"
Cohesion: 0.31
Nodes (16): fail(), isAccount(), isDirection(), isInterval(), isKind(), isLocalDateTime(), isObj(), isTrimmedText() (+8 more)

### Community 32 - "Kind"
Cohesion: 0.15
Nodes (11): AddPreset, ContractBooking, ImportRow, LedgerOptions, RecurringSuggestion, Account, Interval, Kind (+3 more)

### Community 33 - "vaultBackup.ts"
Cohesion: 0.20
Nodes (13): VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope(), makeBackup() (+5 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.18
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 35 - "ExcelPage.tsx"
Cohesion: 0.18
Nodes (22): ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName(), ExportMode, ExportRange, Line (+14 more)

### Community 36 - "App.tsx"
Cohesion: 0.09
Nodes (30): AppContent(), CALENDAR_SUBS, CalendarView, eventFormProps(), FormState, Nav, SETTINGS_SUBS, START_SUBS (+22 more)

### Community 37 - "CategoryManager.tsx"
Cohesion: 0.38
Nodes (8): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), ConfirmDialog(), countRecurringInCategory(), countTransactionsInCategory()

### Community 38 - "TodoDetailSheet.tsx"
Cohesion: 0.16
Nodes (32): To-do (Kalender-Tab, Umschalter „Kalender | To-do“; `domain/todos.ts`, `pages/TodoPage.tsx`, `pages/TodoListPage.tsx`, `components/Todo*.tsx`), BellIcon(), PlannedIcon(), PlusIcon(), RepeatSmallIcon(), XIcon(), TodoAddBar(), submit() (+24 more)

### Community 39 - "Architektur"
Cohesion: 0.23
Nodes (26): Architektur, Regeln, react-dom, NavStack(), Phase, zoomProgress(), SwipePane(), SwipeRow() (+18 more)

### Community 40 - "AppData"
Cohesion: 0.10
Nodes (21): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), UNDO_MS, UndoToast(), EncryptedRepository, LocalStorageRepository, STORAGE_KEY, isObj(), migrate() (+13 more)

### Community 41 - "CalendarImport.tsx"
Cohesion: 0.26
Nodes (11): CalendarImportSheet(), onFile(), EventImportPreview(), run(), plural(), readCalendar(), importKey(), recurrenceText() (+3 more)

### Community 42 - "write.ts"
Cohesion: 0.14
Nodes (22): WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder, escapeXml(), excelSerial() (+14 more)

### Community 43 - "createRecurringFromSuggestion"
Cohesion: 0.47
Nodes (6): coveredByRule(), addRecurring(), createRecurringFromSuggestion(), ruleFields(), updateRecurring(), validateRecurringInput()

### Community 44 - "icsRead.ts"
Cohesion: 0.12
Nodes (27): BYDAY, cut(), formatters, get(), IcsTime, instantToLocal(), p2(), parseDuration() (+19 more)

### Community 45 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 46 - "calendar.ts"
Cohesion: 0.13
Nodes (29): compareOccurrences(), daysInMonth(), daysWithEvents(), defaultTimes(), FinanceEntryType, generateDates(), lastDay(), makeOccurrence() (+21 more)

### Community 47 - "defaults.ts"
Cohesion: 0.11
Nodes (23): EV, mutate(), sample(), budgetAlerts(), tx(), withBudget(), builtInId(), createDefaultCategories() (+15 more)

### Community 48 - "CalendarPage.tsx"
Cohesion: 0.21
Nodes (26): Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen), DayList(), MonthGrid, dayMonthLabel(), DaySegment, daySegments(), financeEntries(), FinanceEntry (+18 more)

### Community 49 - "MonthGrid.tsx"
Cohesion: 0.29
Nodes (7): dayLabel(), MONTH_NAMES, plural(), RING_SPRING, GridDay, WEEKDAY_LONG, WEEKDAY_SHORT

### Community 50 - "spring.ts"
Cohesion: 0.14
Nodes (25): isSettled(), MAX_FRAME_S, MAX_STEP_S, REST_OFFSET_PX, REST_VELOCITY, SPRING_BOUNCY, SPRING_CALM, SpringParams (+17 more)

### Community 51 - "LargeTitleHeader"
Cohesion: 0.15
Nodes (20): HeaderAction, LargeTitleHeader(), barProgress(), clamp01(), GLOW_END_PX, GLOW_LAG, glowOffset(), HERO_SHIFT_DIV (+12 more)

### Community 52 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 53 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 54 - "seed"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 55 - "patchTodo"
Cohesion: 0.15
Nodes (18): isLocalDateTime(), addStep(), addTodo(), changeStep(), checkTodoDate(), cleanTodoRecurrence(), cleanTodoTitle(), deleteStep() (+10 more)

### Community 56 - "theme.ts"
Cohesion: 0.20
Nodes (11): App(), useThemePref(), applyTheme(), CHROME_COLOR, getThemePref(), PREFS, resolveTheme(), setThemePref() (+3 more)

### Community 57 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.29
Nodes (6): Alle Daten löschen (Einstellungen → Datensicherung → „Neu anfangen“), Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack

### Community 58 - "EventSheet"
Cohesion: 0.25
Nodes (15): start(), EventSheet(), changeStart(), exportIcs(), submit(), toggleAllDay(), recurrenceFrom(), repeatChoiceOf() (+7 more)

### Community 59 - "csv.ts"
Cohesion: 0.27
Nodes (10): out(), pan(), svg(), DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter() (+2 more)

### Community 60 - "useFinance"
Cohesion: 0.41
Nodes (9): react, SaveError(), SubPageHeader(), BalancePage, CategoriesPage, KIND_OPTIONS, ProfilePage, SecurityPage (+1 more)

### Community 61 - "pinch.test.ts"
Cohesion: 0.23
Nodes (11): PINCH_CLOSE_FACTOR, PINCH_MIN_DISTANCE, PINCH_OPEN_FACTOR, pinchDistance(), pinchFactor(), pinchVelocity(), Point, Sample (+3 more)

### Community 62 - "TodayTodosCard.tsx"
Cohesion: 0.50
Nodes (7): SunIcon(), TodayTodosCard(), TodoCheck(), TodoMeta(), TodoRow, dueLabel(), isOverdue()

### Community 63 - "CalendarEvent"
Cohesion: 0.40
Nodes (4): EventSheetProps, Occurrence, CalendarEvent, ParsedIcs

### Community 64 - "cleanListInput"
Cohesion: 0.50
Nodes (4): addList(), cleanListInput(), renameList(), updateList()

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 368 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `importMapping.ts` to `lib/backupReminder.ts`, `actions.ts`, `Sheet`, `package.json`, `recurring.ts`, `gesture.ts`, `LockProvider.tsx`, `importRows.ts`, `haptic`, `crypto.ts`, `ics.ts`, `todos.ts`, `dates.ts`, `StartPage.tsx`, `vault.test.ts`, `vaultBackup.ts`, `ExcelPage.tsx`, `App.tsx`, `write.ts`, `icsRead.ts`, `calendar.ts`, `defaults.ts`, `spring.ts`, `LargeTitleHeader`, `theme.ts`, `csv.ts`, `pinch.test.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/backupReminder.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14942528735632185 - nodes in this community are weakly interconnected._
- **Why does `AppData` connect `AppData` to `lib/backupReminder.ts`, `actions.ts`, `recurring.ts`, `todayISO`, `vault.ts`, `LockProvider.tsx`, `FinanceApi`, `crypto.ts`, `todos.ts`, `dates.ts`, `StartPage.tsx`, `vault.test.ts`, `AppData`, `vaultBackup.ts`, `LockContext.ts`, `ExcelPage.tsx`, `Architektur`, `calendar.ts`, `defaults.ts`, `Projektkontext: finanz-app („Finanzklar“)`, `TodayTodosCard.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._