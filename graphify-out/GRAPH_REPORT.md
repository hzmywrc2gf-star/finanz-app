# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 68 files · ~43,841 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 533 nodes · 1570 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf51200a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CategoryManager.tsx
- actions.ts
- dates.ts
- StartPage.tsx
- package.json
- smoke.mjs
- recurring.ts
- deploy.yml
- gesture.ts
- FinanceApi
- Regeln
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- ledger.ts
- backup.ts
- FinanceContext.tsx
- types.ts
- TransferDirection

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 28 edges
2. `react` - 25 edges
3. `todayISO()` - 25 edges
4. `AppData` - 25 edges
5. `StartPage()` - 24 edges
6. `formatCents()` - 22 edges
7. `Architektur` - 22 edges
8. `FinanceApi` - 21 edges
9. `MonthPage()` - 20 edges
10. `Regeln` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Regeln` --references--> `StartStack()`  [INFERRED]
  CLAUDE.md → src/components/StartStack.tsx
- `Regeln` --references--> `SubPageHeader()`  [INFERRED]
  CLAUDE.md → src/components/SubPageHeader.tsx
- `Regeln` --references--> `SwipePane()`  [INFERRED]
  CLAUDE.md → src/components/SwipePane.tsx

## Import Cycles
- None detected.

## Communities (20 total, 2 thin omitted)

### Community 0 - "CategoryManager.tsx"
Cohesion: 0.46
Nodes (7): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), countRecurringInCategory(), countTransactionsInCategory()

### Community 1 - "actions.ts"
Cohesion: 0.13
Nodes (37): mutate(), sample(), tx(), withBudget(), createDefaultData(), addCategory(), addRecurring(), AddRecurringOptions (+29 more)

### Community 2 - "dates.ts"
Cohesion: 0.12
Nodes (32): BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), item(), UnbudgetedSpending, CategorySum (+24 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.07
Nodes (82): react, App(), FormState, StartNav, subOf(), BudgetForm(), save(), submit() (+74 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (27): Prüfen, balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+19 more)

### Community 6 - "recurring.ts"
Cohesion: 0.15
Nodes (26): RecurringManager(), nextLabel(), formatDateDE(), formatDayMonth(), bookDue(), ContractsSummary, daysInMonth(), firstStep() (+18 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.13
Nodes (39): Architektur, react-dom, Sheet(), Phase, StackAnim, StartStack(), SubView, SwipePane() (+31 more)

### Community 9 - "FinanceApi"
Cohesion: 0.11
Nodes (7): ContractBooking, Interval, Kind, ContractBookingInput, RecurringInput, TransactionInput, FinanceApi

### Community 10 - "Regeln"
Cohesion: 0.10
Nodes (22): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+14 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - "ledger.ts"
Cohesion: 0.20
Nodes (9): amountText(), groupByMonth(), LedgerEntry, LedgerMonth, LedgerOptions, matches(), normalize(), data (+1 more)

### Community 16 - "backup.ts"
Cohesion: 0.28
Nodes (11): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), parseBackup(), validateAppData() (+3 more)

### Community 17 - "FinanceContext.tsx"
Cohesion: 0.29
Nodes (6): LocalStorageRepository, STORAGE_KEY, FinanceRepository, AppData, defaultRepo, FinanceContext

### Community 18 - "types.ts"
Cohesion: 0.23
Nodes (8): builtInId(), createDefaultCategories(), EXPENSE_DEFAULTS, FALLBACK_NAME, INCOME_DEFAULTS, Category, Settings, Transfer

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `StartPage.tsx` to `CategoryManager.tsx`, `package.json`, `recurring.ts`, `gesture.ts`, `Regeln`, `FinanceContext.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12560975609756098 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `StartPage.tsx` to `smoke.mjs`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `dates.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11740890688259109 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `StartPage.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07417582417582418 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06970128022759602 - nodes in this community are weakly interconnected._