# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 96 files · ~74,584 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 794 nodes · 2362 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9285a8db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- actions.ts
- StartPage.tsx
- StartPage.tsx
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- backup.ts
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- backup.ts
- crypto.ts
- createVault
- bytesToBase64

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `useFinance()` - 35 edges
3. `AppData` - 34 edges
4. `haptic()` - 33 edges
5. `Regeln` - 33 edges
6. `Architektur` - 28 edges
7. `createVault()` - 27 edges
8. `todayISO()` - 27 edges
9. `Sheet()` - 26 edges
10. `StartPage` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupImportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupImportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `LockScreen()`  [INFERRED]
  CLAUDE.md → src/components/LockScreen.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `create()`  [INFERRED]
  CLAUDE.md → src/components/LockSetupSheet.tsx

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.07
Nodes (38): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+30 more)

### Community 1 - "actions.ts"
Cohesion: 0.10
Nodes (45): exportJSON(), mutate(), sample(), item(), tx(), withBudget(), createDefaultData(), withTx() (+37 more)

### Community 2 - "StartPage.tsx"
Cohesion: 0.07
Nodes (59): App(), AppContent(), FormState, StartNav, subOf(), Fab(), base, BudgetIcon() (+51 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.07
Nodes (72): vitest, RepeatIcon(), SwapIcon(), LedgerList, TransferRow, TransactionList, TransactionRow, BudgetItem (+64 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (26): addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+18 more)

### Community 6 - "types.ts"
Cohesion: 0.10
Nodes (49): react, BackupExportSheet(), submit(), BackupImportSheet(), submit(), BudgetForm(), save(), submit() (+41 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.08
Nodes (65): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+57 more)

### Community 9 - "backup.ts"
Cohesion: 0.09
Nodes (5): Interval, ContractBookingInput, RecurringInput, TransferInput, FinanceApi

### Community 10 - "perf.mjs"
Cohesion: 0.09
Nodes (24): center(), { chromium, devices }, errors, openBookings(), record(), REPS, results, rows (+16 more)

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
Nodes (26): AUTO_LOCK_OPTIONS, b64(), Bytes, canonical(), DATA_AAD, DEFAULT_AUTO_LOCK, ERR_PASSKEY, ERR_PASSWORD (+18 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.05
Nodes (51): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, Teil B: App-Sperre (optional, standardmäßig aus), Auf dem iPhone installieren (+43 more)

### Community 17 - "backup.ts"
Cohesion: 0.19
Nodes (14): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+6 more)

### Community 18 - "crypto.ts"
Cohesion: 0.16
Nodes (23): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), Bytes, decryptBytes(), decryptJSON(), encryptBytes(), ENVELOPE_FORMAT, ENVELOPE_VERSION, generateDataKey() (+15 more)

### Community 19 - "createVault"
Cohesion: 0.24
Nodes (16): createVault(), extractableDek(), info(), loadData(), loadRaw(), replaceSlot(), setPasswordWith(), unlockWithPasskey() (+8 more)

### Community 20 - "bytesToBase64"
Cohesion: 0.33
Nodes (7): encryptData(), saveData(), kdfSlotFor(), randomBytes(), utf8(), wrapSlot(), bytesToBase64()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `SettingsPage.tsx`, `StartPage.tsx`, `StartPage.tsx`, `package.json`, `gesture.ts`, `LockProvider.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `SettingsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
- **Why does `submit()` connect `types.ts` to `StartPage.tsx`, `perf.mjs`, `StartPage.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (optional, standardmäßig aus)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09948979591836735 - nodes in this community are weakly interconnected._
- **Why does `start()` connect `perf.mjs` to `types.ts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._