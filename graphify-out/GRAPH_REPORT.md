# Graph Report - finanz-app  (2026-11-01)

## Corpus Check
- 155 files · ~124,615 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 1)

## Summary
- 1206 nodes · 3961 edges · 46 communities (44 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 200 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb904531`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- buildIcs
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- FinanceContext.tsx
- package.json
- smoke.mjs
- recurringDetect.ts
- deploy.yml
- gesture.ts
- Regeln
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
- createVault
- BackupPage.tsx
- domain/types.ts
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
- write.ts
- password.ts
- ref_node_fs

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 60 edges
2. `useFinance()` - 59 edges
3. `react` - 57 edges
4. `Regeln` - 55 edges
5. `AppData` - 49 edges
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
- `Regeln` --references--> `AppLockSettings()`  [INFERRED]
  CLAUDE.md → src/components/AppLockSettings.tsx

## Import Cycles
- None detected.

## Communities (46 total, 2 thin omitted)

### Community 0 - "buildIcs"
Cohesion: 0.35
Nodes (9): RFC-5545, buildIcs(), escapeIcsText(), foldIcsLine(), IcsReminder, localStamp(), pad(), base (+1 more)

### Community 1 - "actions.ts"
Cohesion: 0.11
Nodes (43): isValidISODate(), addCategory(), addInvoice(), AddRecurringOptions, bookNextNow(), bookOccurrence(), changeInvoiceAmount(), cleanNote() (+35 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 3 - "FinanceContext.tsx"
Cohesion: 0.06
Nodes (104): Architektur, Kauf auf Rechnung (`src/domain/invoices.ts`, `components/InvoiceSheets.tsx`, `lib/ics.ts`, `lib/invoiceCalendar.ts`), react, NewRecoveryKeySheet(), BudgetForm(), save(), submit(), ConfirmDialog() (+96 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (9): { chromium, devices }, deks, errors, futter, futterText, json, rawNewContext, swipe() (+1 more)

### Community 6 - "recurringDetect.ts"
Cohesion: 0.19
Nodes (20): amountClusters(), coveredByRule(), dayOf(), detectRecurring(), effectiveDay(), hashKey(), INTERVALS, lastDayOfMonth() (+12 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.08
Nodes (66): NavStack(), Phase, PILL_SPRING, SwipePane(), SwipeRow(), animationMs(), Axis, BACK_FRACTION (+58 more)

### Community 9 - "Regeln"
Cohesion: 0.05
Nodes (72): Regeln, App(), AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf() (+64 more)

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
Nodes (29): b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD, ERR_RECOVERY (+21 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.21
Nodes (16): Greeting(), VaultSession, Bytes, ERR_PASSKEY_CANCELLED, ERR_PASSKEY_UNSUPPORTED, getPrfOutput(), isPasskeyPrfLikelySupported(), newPrfSalt() (+8 more)

### Community 17 - "FinanceApi"
Cohesion: 0.07
Nodes (8): RecurringSuggestion, Interval, TransferDirection, ContractBookingInput, InvoiceInput, RecurringInput, TransferInput, FinanceApi

### Community 18 - "read.ts"
Cohesion: 0.17
Nodes (16): ImportSource, columnIndex(), decoder, openXlsx(), parseCell(), resolveTarget(), textOf(), XlsxFile (+8 more)

### Community 19 - "importRows.ts"
Cohesion: 0.12
Nodes (30): Excel & CSV (Einstellungen → „Excel & CSV“, `src/pages/settings/ExcelPage.tsx`, `components/ImportSheet.tsx`), resolveExportRange(), CASH_WORDS, categoryKey(), cellToString(), duplicateKey(), excelSerialToISO(), EXPENSE_WORDS (+22 more)

### Community 20 - "LockScreen.tsx"
Cohesion: 0.29
Nodes (8): LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit(), NewPasswordScreen()

### Community 21 - "crypto.ts"
Cohesion: 0.17
Nodes (22): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), Bytes, decryptJSON(), ENVELOPE_FORMAT, ENVELOPE_VERSION, generateDataKey(), generateRecoveryKey(), Header (+14 more)

### Community 22 - "createVault"
Cohesion: 0.19
Nodes (21): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), createVault(), encryptData(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot() (+13 more)

### Community 23 - "BackupPage.tsx"
Cohesion: 0.12
Nodes (34): Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`), BackupExportSheet(), submit(), BackupImportSheet(), submit(), errMsg(), LockSetupScreen(), addFaceId() (+26 more)

### Community 24 - "domain/types.ts"
Cohesion: 0.06
Nodes (69): vitest, BalanceChart, monotonePath(), BudgetBar(), ChevronLeft(), RepeatIcon(), SwapIcon(), LedgerList (+61 more)

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
Cohesion: 0.13
Nodes (23): mutate(), sample(), budgetAlerts(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData() (+15 more)

### Community 30 - "vault.test.ts"
Cohesion: 0.20
Nodes (16): Attempts, ATTEMPTS_KEY, BASE_WAIT_MS, FREE_ATTEMPTS, MAX_WAIT_MS, readAttempts(), recordFailure(), recordSuccess() (+8 more)

### Community 31 - "AppData"
Cohesion: 0.12
Nodes (17): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, validateAppData() (+9 more)

### Community 32 - "Kind"
Cohesion: 0.27
Nodes (7): ContractBooking, ImportRow, LedgerOptions, Account, Kind, ImportBooking, TransactionInput

### Community 33 - "vaultBackup.ts"
Cohesion: 0.18
Nodes (14): STORAGE_KEY, VAULT_KEY, buildVaultBackup(), ERR_BACKUP_BROKEN, ERR_BACKUP_SECRET, ERR_BACKUP_UNKNOWN, isObj(), parseEnvelope() (+6 more)

### Community 34 - "LockContext.ts"
Cohesion: 0.20
Nodes (3): AutoLockMinutes, LockApi, LockContext

### Community 35 - "csv.ts"
Cohesion: 0.19
Nodes (16): ExportMode, ExportRange, DecodedText, decodeText(), decodeWindows1252(), Delimiter, detectDelimiter(), parseCsv() (+8 more)

### Community 36 - "Prüfen"
Cohesion: 0.31
Nodes (8): Prüfen, ensureOpen(), keepAlive(), readStored(), reload(), runSetup(), storedWhen(), withVault()

### Community 37 - "AppLockSettings.tsx"
Cohesion: 0.21
Nodes (14): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+6 more)

### Community 38 - "openStartPage"
Cohesion: 0.25
Nodes (8): balance(), hubRow(), mustBalance(), openBookings(), openCash(), openContracts(), openStartPage(), tab()

### Community 39 - "bodyText"
Cohesion: 0.29
Nodes (8): bodyText(), countIn(), expectNoText(), expectText(), fixedCosts(), flatText(), mustFixed(), nbsp()

### Community 40 - "exportSheet.ts"
Cohesion: 0.28
Nodes (13): ALL_TIME, bookingLines(), buildExportSheets(), countExportRows(), exportFileName(), Line, money(), monthRows() (+5 more)

### Community 41 - "openSettings"
Cohesion: 0.40
Nodes (5): addTx(), openSettings(), seed(), settled(), tabOn()

### Community 42 - "zip.ts"
Cohesion: 0.24
Nodes (12): CentralEntry, crc32(), CRC_TABLE, encoder, inflateRaw(), MAX_ENTRY_BYTES, readCentral(), readZip() (+4 more)

### Community 43 - "write.ts"
Cohesion: 0.35
Nodes (9): WriteSheet, buildXlsx(), cellXml(), centsToDecimal(), columnLetters(), encoder, escapeXml(), excelSerial() (+1 more)

### Community 44 - "password.ts"
Cohesion: 0.39
Nodes (5): PasswordFields(), greetingText(), MIN_PASSWORD_LENGTH, passwordStrength, STRENGTH_LABEL

### Community 45 - "ref_node_fs"
Cohesion: 0.60
Nodes (3): out(), pan(), svg()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `domain/types.ts` to `buildIcs`, `actions.ts`, `FinanceContext.tsx`, `package.json`, `recurringDetect.ts`, `gesture.ts`, `Regeln`, `importRows.ts`, `crypto.ts`, `LargeTitleHeader.tsx`, `lib/backupReminder.ts`, `ImportSheet.tsx`, `defaults.ts`, `vault.test.ts`, `vaultBackup.ts`, `csv.ts`, `exportSheet.ts`, `zip.ts`, `write.ts`, `password.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `haptic()` (e.g. with `Monatliche Sicherung (iCloud) (`domain/backupReminder.ts`, `lib/backupReminder.ts`, `data/vaultBackup.ts`, `hooks/useVaultBackup.ts`, `components/BackupReminderCard.tsx`, `VaultBackupImportSheet.tsx`)` and `Regeln`) actually correct?**
  _`haptic()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1101010101010101 - nodes in this community are weakly interconnected._
- **Why does `Regeln` connect `Regeln` to `actions.ts`, `Projektkontext: finanz-app („Finanzklar“)`, `FinanceContext.tsx`, `AppLockSettings.tsx`, `openStartPage`, `recurringDetect.ts`, `gesture.ts`, `FinanceApi`, `domain/types.ts`, `LargeTitleHeader.tsx`, `AppData`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Projektkontext: finanz-app („Finanzklar“)` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._