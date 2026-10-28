# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 59 files · ~35,464 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 474 nodes · 1366 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b496440`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.ts
- actions.ts
- dates.ts
- StartPage.tsx
- package.json
- smoke.mjs
- recurring.ts
- deploy.yml
- ledger.ts
- types.ts
- Projektkontext: finanz-app („Finanzklar“)
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 28 edges
2. `todayISO()` - 25 edges
3. `AppData` - 24 edges
4. `StartPage()` - 24 edges
5. `formatCents()` - 22 edges
6. `react` - 21 edges
7. `FinanceApi` - 21 edges
8. `Transaction` - 19 edges
9. `MonthPage()` - 19 edges
10. `RecurringForm()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `FinanceRepository`  [INFERRED]
  CLAUDE.md → src/data/repository.ts
- `Architektur` --references--> `parseEuroInput()`  [INFERRED]
  CLAUDE.md → src/domain/money.ts
- `Architektur` --references--> `monthTrend()`  [INFERRED]
  CLAUDE.md → src/domain/month.ts
- `Architektur` --references--> `niceAxisMax()`  [INFERRED]
  CLAUDE.md → src/domain/month.ts

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.16
Nodes (31): react, BudgetForm(), save(), submit(), CategoryManager(), CategorySection(), add(), saveRename() (+23 more)

### Community 1 - "actions.ts"
Cohesion: 0.11
Nodes (41): mutate(), sample(), tx(), withBudget(), isValidISODate(), createDefaultData(), withTx(), bookDue() (+33 more)

### Community 2 - "dates.ts"
Cohesion: 0.10
Nodes (50): ChevronRight(), RepeatIcon(), SwapIcon(), LedgerList(), TransferRow(), TransactionList(), TransactionRow(), BudgetItem (+42 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.10
Nodes (43): Architektur, Regeln, App(), FormState, Fab(), base, BudgetIcon(), CashIcon() (+35 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (37): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+29 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.09
Nodes (24): balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText(), fixedCosts() (+16 more)

### Community 6 - "recurring.ts"
Cohesion: 0.17
Nodes (20): RecurringManager(), nextLabel(), formatDateDE(), formatDayMonth(), ContractsSummary, daysInMonth(), firstStep(), INTERVAL_LABELS (+12 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "ledger.ts"
Cohesion: 0.20
Nodes (10): AddPreset, amountText(), ledgerEntries(), LedgerEntry, LedgerMonth, LedgerOptions, matches(), normalize() (+2 more)

### Community 9 - "types.ts"
Cohesion: 0.06
Nodes (33): ContractBooking, fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), parseBackup() (+25 more)

### Community 10 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.14
Nodes (12): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen (+4 more)

### Community 11 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `dates.ts`, `StartPage.tsx`, `package.json`, `recurring.ts`, `types.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11313131313131314 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `types.ts` to `smoke.mjs`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `dates.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09518773135906927 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `types.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09966329966329966 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0627177700348432 - nodes in this community are weakly interconnected._