# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 72 files · ~49,139 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 555 nodes · 1671 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9d09484`
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
- Projektkontext: finanz-app („Finanzklar“)

## God Nodes (most connected - your core abstractions)
1. `useFinance()` - 32 edges
2. `Regeln` - 29 edges
3. `react` - 27 edges
4. `todayISO()` - 25 edges
5. `AppData` - 25 edges
6. `StartPage()` - 25 edges
7. `formatCents()` - 22 edges
8. `Architektur` - 22 edges
9. `FinanceApi` - 21 edges
10. `Transaction` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Regeln` --references--> `TransferRow()`  [INFERRED]
  CLAUDE.md → src/components/LedgerList.tsx
- `Regeln` --references--> `SubPageHeader()`  [INFERRED]
  CLAUDE.md → src/components/SubPageHeader.tsx
- `Regeln` --references--> `TransactionRow()`  [INFERRED]
  CLAUDE.md → src/components/TransactionList.tsx

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "FinanceContext.tsx"
Cohesion: 0.13
Nodes (38): react, BudgetForm(), save(), submit(), CategoryManager(), CategorySection(), add(), saveRename() (+30 more)

### Community 1 - "actions.ts"
Cohesion: 0.10
Nodes (45): mutate(), sample(), tx(), withBudget(), builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS (+37 more)

### Community 2 - "dates.ts"
Cohesion: 0.08
Nodes (55): App(), FormState, StartNav, subOf(), ChevronLeft(), ChevronRight(), StackAnim, SubPageHeader() (+47 more)

### Community 3 - "types.ts"
Cohesion: 0.09
Nodes (41): Fab(), base, BudgetIcon(), CashIcon(), ClearIcon(), ContractIcon(), HomeIcon(), ListIcon() (+33 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+28 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.07
Nodes (30): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText() (+22 more)

### Community 6 - "recurring.ts"
Cohesion: 0.14
Nodes (31): RecurringManager(), nextLabel(), budgetAlerts(), formatDateDE(), formatDayMonth(), formatShortDay(), formatSigned(), bookDue() (+23 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.12
Nodes (47): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+39 more)

### Community 9 - "backup.ts"
Cohesion: 0.06
Nodes (26): AddPreset, ContractBooking, fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj() (+18 more)

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

### Community 15 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.15
Nodes (11): Backlog (nicht in v1), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen (+3 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `FinanceContext.tsx` to `dates.ts`, `types.ts`, `package.json`, `recurring.ts`, `gesture.ts`, `theme.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `Regeln` (e.g. with `ConfirmDialog()` and `TransferRow()`) actually correct?**
  _`Regeln` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Should `FinanceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12627450980392158 - nodes in this community are weakly interconnected._
- **Why does `saveBalance()` connect `FinanceContext.tsx` to `smoke.mjs`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09877551020408164 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `FinanceContext.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `dates.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08165057067603161 - nodes in this community are weakly interconnected._