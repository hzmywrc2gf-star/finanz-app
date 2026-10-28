# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 78 files · ~53,622 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 600 nodes · 1817 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `755db239`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FinanceContext.tsx
- actions.ts
- dates.ts
- types.ts
- package.json
- smoke.mjs
- recurring.ts
- deploy.yml
- gesture.ts
- backup.ts
- theme.ts
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- crypto.ts

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 32 edges
2. `react` - 29 edges
3. `Regeln` - 29 edges
4. `todayISO()` - 28 edges
5. `AppData` - 27 edges
6. `StartPage()` - 25 edges
7. `SettingsPage()` - 23 edges
8. `formatCents()` - 22 edges
9. `haptic()` - 22 edges
10. `Architektur` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B = App-Sperre, noch offen)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Regeln` --references--> `TransferRow()`  [INFERRED]
  CLAUDE.md → src/components/LedgerList.tsx
- `Regeln` --references--> `SubPageHeader()`  [INFERRED]
  CLAUDE.md → src/components/SubPageHeader.tsx

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "FinanceContext.tsx"
Cohesion: 0.08
Nodes (54): react, BackupExportSheet(), submit(), MIN_PASSWORD_LENGTH, BudgetForm(), save(), submit(), CategoryManager() (+46 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (49): mutate(), sample(), item(), tx(), withBudget(), isValidISODate(), builtInId(), createDefaultCategories() (+41 more)

### Community 2 - "dates.ts"
Cohesion: 0.10
Nodes (48): ChevronLeft(), submit(), SubPageHeader(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf() (+40 more)

### Community 3 - "types.ts"
Cohesion: 0.11
Nodes (39): App(), FormState, StartNav, subOf(), Fab(), base, BudgetIcon(), CashIcon() (+31 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (39): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+31 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.05
Nodes (38): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, addTx(), balance(), bodyText() (+30 more)

### Community 6 - "recurring.ts"
Cohesion: 0.16
Nodes (23): RecurringManager(), nextLabel(), bookDue(), ContractsSummary, daysInMonth(), firstStep(), INTERVAL_LABELS, monthIndex() (+15 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.12
Nodes (47): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+39 more)

### Community 9 - "backup.ts"
Cohesion: 0.06
Nodes (30): ContractBooking, UNDO_MS, UndoToast(), fail(), isAccount(), isDirection(), isInterval(), isKind() (+22 more)

### Community 10 - "theme.ts"
Cohesion: 0.24
Nodes (9): useThemePref(), applyTheme(), CHROME_COLOR, getThemePref(), PREFS, resolveTheme(), setThemePref(), THEME_KEY (+1 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "crypto.ts"
Cohesion: 0.13
Nodes (31): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B = App-Sperre, noch offen), BackupImportSheet(), submit(), decodeBackupFile(), base64ToBytes(), Bytes, bytesToBase64(), decryptBytes() (+23 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `FinanceContext.tsx` to `dates.ts`, `types.ts`, `package.json`, `gesture.ts`, `backup.ts`, `theme.ts`, `crypto.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `TransferRow()`) actually correct?**
  _`Regeln` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Should `FinanceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07997265892002735 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `FinanceContext.tsx` to `smoke.mjs`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09014675052410902 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `FinanceContext.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `dates.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09571655208884189 - nodes in this community are weakly interconnected._