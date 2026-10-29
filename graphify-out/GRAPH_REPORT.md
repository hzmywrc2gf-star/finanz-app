# Graph Report - finanz-app  (2026-10-29)

## Corpus Check
- 108 files · ~83,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 851 nodes · 2630 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `493bcc96`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FinanceContext.tsx
- actions.ts
- Projektkontext: finanz-app („Finanzklar“)
- App.tsx
- package.json
- smoke.mjs
- types.ts
- deploy.yml
- gesture.ts
- StartPage.tsx
- perf.mjs
- compilerOptions
- compilerOptions
- .oxlintrc.json
- tsconfig.json
- vault.ts
- LockProvider.tsx
- FinanceApi
- platform.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 46 edges
2. `useFinance()` - 45 edges
3. `Regeln` - 44 edges
4. `AppData` - 37 edges
5. `haptic()` - 34 edges
6. `StartPage` - 31 edges
7. `todayISO()` - 30 edges
8. `Architektur` - 30 edges
9. `createVault()` - 27 edges
10. `formatCents()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Regeln` --references--> `balance()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `withVault()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Prüfen` --references--> `keepAlive()`  [INFERRED]
  CLAUDE.md → e2e/smoke.mjs
- `Regeln` --references--> `tabOf()`  [INFERRED]
  CLAUDE.md → src/App.tsx

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "FinanceContext.tsx"
Cohesion: 0.05
Nodes (64): vitest, RecurringForm(), submit(), RecurringManager(), nextLabel(), UNDO_MS, UndoToast(), fail() (+56 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (48): CategoryManager(), CategorySection(), add(), saveRename(), errMsg(), mutate(), sample(), item() (+40 more)

### Community 2 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.22
Nodes (7): Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App, Funktionen, Nächste Ausbaustufen, Online stellen (GitHub Pages, kostenlos), Starten, Technik

### Community 3 - "App.tsx"
Cohesion: 0.08
Nodes (61): react, AppContent(), FormState, Nav, SETTINGS_SUBS, START_SUBS, subOf(), SubView (+53 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.07
Nodes (37): Prüfen, addTx(), balance(), bodyText(), { chromium, devices }, countIn(), deks, ensureOpen() (+29 more)

### Community 6 - "types.ts"
Cohesion: 0.10
Nodes (41): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+33 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.07
Nodes (71): Architektur, Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Regeln, Stack, react-dom (+63 more)

### Community 9 - "StartPage.tsx"
Cohesion: 0.06
Nodes (81): BalanceChart, monotonePath(), BudgetBar(), Fab(), ArchiveIcon(), base, BudgetIcon(), CashIcon() (+73 more)

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
Cohesion: 0.06
Nodes (76): Teil B: App-Sperre (Pflicht, Nutzerwunsch: die App öffnet sich nur mit Passwort bzw. Face ID), Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), STORAGE_KEY, b64(), Bytes, canonical(), createVault(), encryptData() (+68 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.06
Nodes (47): Greeting(), LockIcon(), AppHeader(), errMsg(), FaceIdGlyph(), LockControls, LockScreen(), submit() (+39 more)

### Community 17 - "FinanceApi"
Cohesion: 0.09
Nodes (3): ContractBookingInput, TransferInput, FinanceApi

### Community 18 - "platform.ts"
Cohesion: 0.50
Nodes (3): isAppleTouchWebKit(), NavigatorInfo, USE_HISTORY

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Regeln` connect `gesture.ts` to `FinanceContext.tsx`, `actions.ts`, `App.tsx`, `smoke.mjs`, `types.ts`, `StartPage.tsx`, `LockProvider.tsx`, `FinanceApi`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `FinanceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05467856325783574 - nodes in this community are weakly interconnected._
- **Why does `react` connect `App.tsx` to `FinanceContext.tsx`, `actions.ts`, `package.json`, `types.ts`, `gesture.ts`, `StartPage.tsx`, `LockProvider.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `Regeln` (e.g. with `balance()` and `subOf()`) actually correct?**
  _`Regeln` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0899854862119013 - nodes in this community are weakly interconnected._
- **Why does `balance()` connect `smoke.mjs` to `gesture.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._