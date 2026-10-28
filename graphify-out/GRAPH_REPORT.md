# Graph Report - finanz-app  (2026-10-28)

## Corpus Check
- 109 files · ~93,146 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 1115 nodes · 2671 edges · 40 communities (39 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e255f9e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- actions.ts
- Security Checklist
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
- Examples
- Projektkontext: finanz-app („Finanzklar“)
- Frontend Accessibility Patterns
- Performance Optimizer
- code-reviewer.md
- a11y-architect.md
- Review Priorities (React-specific only)
- 5. Re-render Optimization (MEDIUM)
- backup.test.ts
- Security Reviewer
- Review Priorities
- planner.md
- Verification Phases
- 6. Rendering Performance (MEDIUM)
- 3. Server-Side Performance (HIGH)
- React Performance
- defaults.ts
- 1. Eliminating Waterfalls (CRITICAL)
- 2. Bundle Size Optimization (CRITICAL)
- 4. Client-Side Data Fetching (MEDIUM-HIGH)
- 8. Advanced Patterns (LOW)
- ECC-Bausteine (Everything Claude Code)

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
- `Technik` --references--> `FinanceRepository`  [INFERRED]
  README.md → src/data/repository.ts
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupExportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupExportSheet.tsx
- `Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID)` --references--> `BackupImportSheet()`  [INFERRED]
  CLAUDE.md → src/components/BackupImportSheet.tsx
- `Regeln` --references--> `ConfirmDialog()`  [INFERRED]
  CLAUDE.md → src/components/ConfirmDialog.tsx
- `Teil B: App-Sperre (optional, standardmäßig aus)` --references--> `LockScreen()`  [INFERRED]
  CLAUDE.md → src/components/LockScreen.tsx

## Import Cycles
- None detected.

## Communities (40 total, 1 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.09
Nodes (36): AppLockSettings(), addFaceId(), generateKey(), removeFaceId(), AUTO_LOCK_CHOICES, AUTO_LOCK_LABEL, ChangePasswordSheet(), submit() (+28 more)

### Community 1 - "actions.ts"
Cohesion: 0.15
Nodes (25): addCategory(), AddRecurringOptions, bookNextNow(), bookOccurrence(), confirmOccurrence(), deleteCategory(), deleteRecurring(), deleteTransaction() (+17 more)

### Community 2 - "Security Checklist"
Cohesion: 0.04
Nodes (48): 10. Dependency Security, 1. Secrets Management, 2. Input Validation, 3. SQL Injection Prevention, 4. Authentication & Authorization, 5. XSS Prevention, 6. CSRF Protection, 7. Rate Limiting (+40 more)

### Community 3 - "StartPage.tsx"
Cohesion: 0.06
Nodes (86): App(), AppContent(), FormState, StartNav, subOf(), Fab(), base, BudgetIcon() (+78 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, react@^19.3.1, react-dom@^19.3.1, devDependencies, oxlint@^1.89.0, sharp@^0.35.5, @types/node@^24.19.2, @types/react@^19.3.0 (+27 more)

### Community 5 - "smoke.mjs"
Cohesion: 0.08
Nodes (26): addTx(), balance(), bodyText(), { chromium, devices }, countIn(), errors, expectNoText(), expectText() (+18 more)

### Community 6 - "types.ts"
Cohesion: 0.06
Nodes (86): react, BackupExportSheet(), submit(), BackupImportSheet(), submit(), BudgetForm(), save(), submit() (+78 more)

### Community 7 - "deploy.yml"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 8 - "gesture.ts"
Cohesion: 0.08
Nodes (65): Architektur, Regeln, react-dom, Sheet(), Phase, StartStack(), SubView, SwipePane() (+57 more)

### Community 9 - "backup.ts"
Cohesion: 0.09
Nodes (8): ContractBooking, Interval, Kind, ContractBookingInput, RecurringInput, TransactionInput, TransferInput, FinanceApi

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
Nodes (74): Verschlüsselung (Teil A: Krypto-Kern + verschlüsselte Backups; Teil B: App-Sperre mit Passwort, Wiederherstellungsschlüssel und Face ID), isObj(), migrate(), b64(), Bytes, canonical(), createVault(), encryptData() (+66 more)

### Community 16 - "LockProvider.tsx"
Cohesion: 0.06
Nodes (45): Teil B: App-Sperre (optional, standardmäßig aus), Greeting(), EncryptedRepository, LocalStorageRepository, STORAGE_KEY, Attempts, ATTEMPTS_KEY, BASE_WAIT_MS (+37 more)

### Community 17 - "backup.ts"
Cohesion: 0.33
Nodes (10): fail(), isAccount(), isDirection(), isInterval(), isKind(), isObj(), MAX_NAME_LENGTH, parseBackup() (+2 more)

### Community 18 - "Examples"
Cohesion: 0.05
Nodes (39): Anti-Patterns, Authoring Custom Plugins, Avoid Barrel Files, Basic Config, Be Explicit with Import Extensions, Build Optimization, Client-Side Access, Common Pitfalls (+31 more)

### Community 19 - "Projektkontext: finanz-app („Finanzklar“)"
Cohesion: 0.13
Nodes (13): Backlog (nicht in v1), ECC-Bausteine (`.claude/agents`, `.claude/skills`), Projektgraph (Graphify), Projektkontext: finanz-app („Finanzklar“), Prüfen, Stack, Auf dem iPhone installieren, Finanzklar – persönliche Haushalts-App (+5 more)

### Community 20 - "Frontend Accessibility Patterns"
Cohesion: 0.09
Nodes (22): Anti-Patterns, ARIA Attributes, aria-describedby, aria-expanded and aria-controls, aria-label vs aria-labelledby, aria-live for Dynamic Content, Checklist, Complete Accessible Form (+14 more)

### Community 21 - "Performance Optimizer"
Cohesion: 0.10
Nodes (20): 1. Identify Performance Issues, 2. Algorithmic Analysis, 3. React Performance Optimization, 4. Bundle Size Optimization, 5. Database & Query Optimization, 6. Network & API Optimization, 7. Memory Leak Detection, Analysis Commands (+12 more)

### Community 22 - "code-reviewer.md"
Cohesion: 0.10
Nodes (19): Approval Criteria, Best Practices (LOW), Code Quality (HIGH), Common False Positives - Skip These, Confidence-Based Filtering, HIGH / CRITICAL Require Proof, It Is Acceptable And Expected To Return Zero Findings, Node.js/Backend Patterns (HIGH) (+11 more)

### Community 23 - "a11y-architect.md"
Cohesion: 0.11
Nodes (17): 1. Perceivable (Information must be presentable), 2. Operable (Interface components must be usable), 3. Understandable (Information must be clear), 4. Robust (Content must be compatible), Accessibility Decision Record Template, Anti-Patterns, Example: Accessible Search Component, Examples (+9 more)

### Community 24 - "Review Priorities (React-specific only)"
Cohesion: 0.11
Nodes (17): Approval Criteria, CRITICAL -- Hook Rules, CRITICAL -- React Security, Diagnostic Commands, HIGH -- Accessibility, HIGH -- Hook Correctness, HIGH -- Rendering and State Correctness, HIGH -- Server/Client Boundary (Next.js App Router / RSC) (+9 more)

### Community 25 - "5. Re-render Optimization (MEDIUM)"
Cohesion: 0.12
Nodes (16): 5. Re-render Optimization (MEDIUM), Avoid memo for simple primitives, Derive during render, never via `useEffect`, Don't define components inside components, Don't subscribe to state used only in callbacks, Extract expensive work into memoized components, Functional `setState` for stable callbacks, Hoist default non-primitive props (+8 more)

### Community 26 - "backup.test.ts"
Cohesion: 0.23
Nodes (14): vitest, mutate(), sample(), tx(), withBudget(), addRecurring(), addTransaction(), addTransfer() (+6 more)

### Community 27 - "Security Reviewer"
Cohesion: 0.13
Nodes (14): 1. Initial Scan, 2. OWASP Top 10 Check, 3. Code Pattern Review, Analysis Commands, Common False Positives, Core Responsibilities, Emergency Response, Key Principles (+6 more)

### Community 28 - "Review Priorities"
Cohesion: 0.13
Nodes (14): Approval Criteria, CRITICAL -- Security, Diagnostic Commands, HIGH -- Async Correctness, HIGH -- Error Handling, HIGH -- Idiomatic Patterns, HIGH -- Node.js Specifics, HIGH -- Type Safety (+6 more)

### Community 29 - "planner.md"
Cohesion: 0.14
Nodes (13): 1. Requirements Analysis, 2. Architecture Review, 3. Step Breakdown, 4. Implementation Order, Best Practices, Plan Format, Planning Process, Prompt Defense Baseline (+5 more)

### Community 30 - "Verification Phases"
Cohesion: 0.15
Nodes (12): Continuous Mode, Integration with Hooks, Output Format, Phase 1: Build Verification, Phase 2: Type Check, Phase 3: Lint Check, Phase 4: Test Suite, Phase 5: Security Scan (+4 more)

### Community 31 - "6. Rendering Performance (MEDIUM)"
Cohesion: 0.17
Nodes (12): 6. Rendering Performance (MEDIUM), `<Activity>` for show/hide instead of mount/unmount, Animate the wrapper, not the SVG, `content-visibility: auto` for long lists, `defer` / `async` on `<script>` tags, Hoist static JSX, Hydration no-flicker via inline script, React DOM resource hints (+4 more)

### Community 32 - "3. Server-Side Performance (HIGH)"
Cohesion: 0.20
Nodes (10): 3. Server-Side Performance (HIGH), Authenticate Server Actions like API routes, Avoid duplicate serialization in RSC props, Hoist static I/O to module scope, LRU cache for cross-request data, Minimize data passed to Client Components, No mutable module-level state in RSC/SSR, Parallelize nested fetches with Promise.all per item (+2 more)

### Community 33 - "React Performance"
Cohesion: 0.22
Nodes (8): 7. JavaScript Performance (LOW-MEDIUM), Attribution, Automated Tools, Lighthouse / Web Vitals Mapping, Priority Index, React Performance, Related, When to Activate

### Community 34 - "defaults.ts"
Cohesion: 0.28
Nodes (8): builtInId(), createDefaultCategories(), createDefaultData(), EXPENSE_DEFAULTS, FALLBACK_NAME, INCOME_DEFAULTS, withRules(), base()

### Community 35 - "1. Eliminating Waterfalls (CRITICAL)"
Cohesion: 0.29
Nodes (7): 1. Eliminating Waterfalls (CRITICAL), Cheap conditions before await, Defer awaits until used, Partial dependencies — start early, await late, Promise.all for independent work, Server Components: parallel through composition, Suspense for streaming

### Community 36 - "2. Bundle Size Optimization (CRITICAL)"
Cohesion: 0.29
Nodes (7): 2. Bundle Size Optimization (CRITICAL), Conditional module loading, Defer third-party scripts, Direct imports, not barrels, Dynamic imports for heavy components, Preload on hover/focus, Statically analyzable paths

### Community 37 - "4. Client-Side Data Fetching (MEDIUM-HIGH)"
Cohesion: 0.40
Nodes (5): 4. Client-Side Data Fetching (MEDIUM-HIGH), Deduplicate global event listeners, localStorage: version + minimize, Passive listeners for scroll, SWR / TanStack Query for deduplication

### Community 38 - "8. Advanced Patterns (LOW)"
Cohesion: 0.40
Nodes (5): 8. Advanced Patterns (LOW), Event handler refs, Init once per app load, `useEffectEvent` deps, `useLatest` for stable callback refs

### Community 39 - "ECC-Bausteine (Everything Claude Code)"
Cohesion: 0.50
Nodes (3): ECC-Bausteine (Everything Claude Code), Lizenz, Was wofür

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `types.ts` to `SettingsPage.tsx`, `StartPage.tsx`, `package.json`, `gesture.ts`, `LockProvider.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useFinance()` (e.g. with `Architektur` and `Regeln`) actually correct?**
  _`useFinance()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `SettingsPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09308510638297872 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `backup.test.ts` to `SettingsPage.tsx`, `actions.ts`, `StartPage.tsx`, `package.json`, `types.ts`, `gesture.ts`, `vault.ts`, `LockProvider.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `haptic()` (e.g. with `Regeln` and `Teil B: App-Sperre (optional, standardmäßig aus)`) actually correct?**
  _`haptic()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Security Checklist` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Why does `submit()` connect `types.ts` to `perf.mjs`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._