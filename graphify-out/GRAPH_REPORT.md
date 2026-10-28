# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 65 files · ~42,302 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 519 nodes · 1529 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04f04918`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- actions.ts
- dates.ts
- StartPage.tsx
- package.json
- smoke.mjs
- recurring.ts
- deploy.yml
- gesture.ts
- types.ts
- Projektkontext: finanz-app („Finanzklar“)
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 28 edges
2. `todayISO()` - 25 edges
3. `react` - 24 edges
4. `AppData` - 24 edges
5. `StartPage()` - 24 edges
6. `formatCents()` - 22 edges
7. `Architektur` - 22 edges
8. `FinanceApi` - 21 edges
9. `MonthPage()` - 20 edges
10. `Transaction` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Regeln` --references--> `SubPageHeader()`  [INFERRED]
  CLAUDE.md → src/components/SubPageHeader.tsx
- `Regeln` --references--> `FinanceRepository`  [INFERRED]
  CLAUDE.md → src/data/repository.ts
- `Architektur` --references--> `budgetAlerts()`  [INFERRED]
  CLAUDE.md → src/domain/budget.ts

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.14
Nodes (22): react, App(), FormState, StartNav, subOf(), CategoryManager(), CategorySection(), add() (+14 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (47): mutate(), sample(), item(), tx(), withBudget(), isValidISODate(), builtInId(), createDefaultCategories() (+39 more)

### Community 2 - "dates.ts"
Cohesion: 0.13
Nodes (37): ChevronLeft(), ChevronRight(), BudgetItem, budgetStatus, BudgetTotal, monthBudgets, percentOf(), UnbudgetedSpending (+29 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.08
Nodes (51): Fab(), base, BudgetIcon(), CashIcon(), ClearIcon(), ContractIcon(), HomeIcon(), ListIcon() (+43 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (27): Prüfen, balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+19 more)

### Community 6 - "recurring.ts"
Cohesion: 0.11
Nodes (43): BudgetForm(), save(), submit(), RecurringForm(), submit(), RecurringManager(), nextLabel(), SegmentedControl() (+35 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.13
Nodes (40): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+32 more)

### Community 9 - "types.ts"
Cohesion: 0.07
Nodes (27): AddPreset, ContractBooking, fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj() (+19 more)

### Community 10 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.15
Nodes (11): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen (+3 more)

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

- **Why does `react` connect `App.tsx` to `dates.ts`, `StartPage.tsx`, `package.json`, `recurring.ts`, `gesture.ts`, `types.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1354679802955665 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `recurring.ts` to `App.tsx`, `smoke.mjs`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09084556254367575 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `recurring.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `dates.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1331923890063425 - nodes in this community are weakly interconnected._
- **Should `StartPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07672634271099744 - nodes in this community are weakly interconnected._