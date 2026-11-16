# Graph Report - finanz-app  (2026-11-16)

## Corpus Check
- 169 files · ~149,307 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 3, (none) 2, .ics 2)

## Summary
- 1382 nodes · 4707 edges · 45 communities (43 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 228 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f24c6d7`
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
- ics.ts
- CalendarEvent
- domain/types.ts
- Icons.tsx
- lib/backupReminder.ts
- importMapping.ts
- vault.test.ts
- AppData
- Kind
- vaultBackup.ts
- LockContext.ts
- ExcelPage.tsx
- AppData
- zip.ts
- createRecurringFromSuggestion
- icsRead.ts
- calendar.ts
- defaults.ts
- CalendarPage.tsx
- addDays
- write.ts
- ref_node_fs

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

## Communities (45 total, 2 thin omitted)

### Community 0 - "createVault"
Cohesion: 0.17
Nodes (22): b64(), canonical(), createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw() (+14 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (48): isLocalDateTime(), addCategory(), addEvent(), addInvoice(), AddRecurringOptions, bookNextNow(), bookOccurrence(), changeInvoiceAmount() (+40 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "StartPage.tsx"
Cohesion: 0.08
Nodes (54): CashIcon(), CheckIcon(), ContractIcon(), ListIcon(), ReceiptIcon(), RefreshIcon(), InvoiceFlow, InvoiceListSheet() (+46 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.06
Nodes (38): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+30 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.19
Nodes (20): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+12 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.06
Nodes (101): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Kalender (5. Tab „Kalender“, Reihenfolge Start, Monat, Budgets, Kalender, Einstellungen), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack (+93 more)

### Community 9 - "App.tsx"
Cohesion: 0.05
Nodes (116): Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), react, AppContent(), CALENDAR_SUBS, CalendarView, eventFormProps(), FormState, Nav (+108 more)

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
Nodes (25): Bytes, DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD, ERR_RECOVERY, HKDF_INFO, KdfParams (+17 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.14
Nodes (24): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Greeting(), EncryptedRepository, vault, VaultSession, buildVaultBackup(), vaultBackupFileName() (+16 more)

### Community 17 - "FinanceApi"
Cohesion: 0.06
Nodes (9): RecurringSuggestion, Interval, TransferDirection, ContractBookingInput, EventInput, InvoiceInput, RecurringInput, TransferInput (+1 more)

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.12
Nodes (38): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), ImportSheet(), changeSheet(), submit(), initialMapping(), plural(), CASH_WORDS, categoryKey() (+30 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.17
Nodes (17): ChangePasswordSheet(), submit(), LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen() (+9 more)

### Community 21 - "crypto.ts"
Cohesion: 0.15
Nodes (27): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), submit(), decodeBackupFile(), Bytes, decryptBytes(), decryptJSON(), deriveKeyFromPassword(), encryptBytes() (+19 more)

### Community 22 - "ics.ts"
Cohesion: 0.26
Nodes (14): buildEventIcs(), buildIcs(), dateStamp(), dateTimeStamp(), escapeIcsText(), foldIcsLine(), FREQ_CODES, IcsReminder (+6 more)

### Community 23 - "CalendarEvent"
Cohesion: 0.40
Nodes (4): EventSheetProps, Occurrence, CalendarEvent, ParsedIcs

### Community 24 - "domain/types.ts"
Cohesion: 0.06
Nodes (75): vitest, BalanceChart, monotonePath(), RepeatIcon(), SwapIcon(), LedgerList, TransferRow, TransactionList (+67 more)

### Community 25 - "Icons.tsx"
Cohesion: 0.05
Nodes (68): App(), BudgetBar(), Fab(), ArchiveIcon(), base, BudgetIcon(), CalendarIcon(), ChevronLeft() (+60 more)

### Community 26 - "lib/backupReminder.ts"
Cohesion: 0.17
Nodes (21): BackupCardBody(), BackupReminderCard(), CloudUpIcon(), backupDue(), month(), useBackupSettings(), BACKUP_REMINDER_KEY, BACKUP_SNOOZE_KEY (+13 more)

### Community 27 - "importMapping.ts"
Cohesion: 0.29
Nodes (8): ColumnMapping, IMPORT_FIELDS, getSavedMapping(), IMPORT_MAPPING_KEY, readAll(), sanitize(), saveMapping(), Stored

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.27
Nodes (15): fail(), isAccount(), isDirection(), isInterval(), isKind(), isLocalDateTime(), isObj(), MAX_NAME_LENGTH (+7 more)

### Community 32 - "Kind"
Cohesion: 0.27
Nodes (7): ContractBooking, ImportRow, LedgerOptions, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "vaultBackup.ts"
Cohesion: 0.18
Nodes (14): onRestoreFile(), STORAGE_KEY, VAULT_KEY, ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), isVaultBackup() (+6 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.18
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 35 - "ExcelPage.tsx"
Cohesion: 0.16
Nodes (19): plural(), ExportMode, ExportRange, DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter() (+11 more)

### Community 40 - "AppData"
Cohesion: 0.19
Nodes (8): LocalStorageRepository, isObj(), migrate(), FinanceRepository, AppData, ImportEventsResult, ImportResult, PayInvoiceResult

### Community 42 - "zip.ts"
Cohesion: 0.24
Nodes (12): CentralEntry, crc32(), CRC_TABLE, encoder, inflateRaw(), MAX_ENTRY_BYTES, readCentral(), readZip() (+4 more)

### Community 43 - "createRecurringFromSuggestion"
Cohesion: 0.67
Nodes (4): createRecurringFromSuggestion(), ruleFields(), updateRecurring(), validateRecurringInput()

### Community 44 - "icsRead.ts"
Cohesion: 0.11
Nodes (31): onFile(), readCalendar(), BYDAY, cut(), ERR_NOT_ICS, formatters, get(), IcsTime (+23 more)

### Community 46 - "calendar.ts"
Cohesion: 0.14
Nodes (32): toggleAllDay(), compareOccurrences(), daysBetween(), daySegments(), daysInMonth(), daysWithEvents(), defaultTimes(), FinanceEntryType (+24 more)

### Community 47 - "defaults.ts"
Cohesion: 0.12
Nodes (24): EV, mutate(), sample(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories() (+16 more)

### Community 48 - "CalendarPage.tsx"
Cohesion: 0.25
Nodes (14): DayList(), dayMonthLabel(), DaySegment, financeEntries(), FinanceEntry, layoutDay(), longDayLabel(), timeFromMinutes() (+6 more)

### Community 50 - "addDays"
Cohesion: 0.19
Nodes (17): start(), EventImportPreview(), run(), EventSheet(), changeStart(), exportIcs(), submit(), recurrenceFrom() (+9 more)

### Community 51 - "write.ts"
Cohesion: 0.29
Nodes (11): Line, WriteCell, WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder (+3 more)

### Community 59 - "ref_node_fs"
Cohesion: 0.60
Nodes (3): out(), pan(), svg()

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 341 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `domain/types.ts` to `actions.ts`, `StartPage.tsx`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `App.tsx`, `LockProvider.tsx`, `importRows.ts`, `crypto.ts`, `ics.ts`, `Icons.tsx`, `lib/backupReminder.ts`, `importMapping.ts`, `vault.test.ts`, `vaultBackup.ts`, `ExcelPage.tsx`, `zip.ts`, `icsRead.ts`, `calendar.ts`, `defaults.ts`, `write.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09387755102040816 - nodes in this community are weakly interconnected._
- **Why does `AppData` connect `AppData` to `vaultBackup.ts`, `actions.ts`, `StartPage.tsx`, `LockContext.ts`, `recurringDetect.ts`, `gesture.ts`, `App.tsx`, `calendar.ts`, `vault.ts`, `defaults.ts`, `FinanceApi`, `LockProvider.tsx`, `crypto.ts`, `domain/types.ts`, `Icons.tsx`, `vault.test.ts`, `AppData`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08050655811849841 - nodes in this community are weakly interconnected._