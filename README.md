# Angular Coding Tasks (L4 / advanced)

30 self-contained Angular debugging/fixing tasks for advanced (L4) developers. Each
task is designed to be solved in **under 10 minutes** and deliberately contains
**multiple distinct bugs** (not a single fix).

**TypeScript and Angular only.** Standalone components, signals, the new control
flow (`@if` / `@for` / `@switch`), `inject()` function, no `NgModule`. Mirrors the
sibling [React bank](../ReactCodingTask) and [vanilla JS bank](../JavaScriptCodingTasks).

Each topic ships as **two runnable apps** (60 apps total):

- `NN-Topic-Task` — leads with a `// TASK NN` header block in `src/app.component.ts`
  (difficulty, target time, the goal, a "things to scrutinise" hint list, and the
  EXPECTED correct behavior), followed by starting code that **misbehaves**.
- `NN-Topic-Solution` — the worked fix, with **every change annotated `// FIX #n`**
  referencing the specific bug.

Stack: **Vite + `@analogjs/vite-plugin-angular` + Angular 21 + TypeScript**, wired
as an **npm workspace** so there is **one install** at the repo root (no
`node_modules` duplicated 60×).

## Running

From the repo root, install **once**:

```pwsh
npm install
```

Then run any single app — either from inside its folder, or by workspace name:

```pwsh
cd 01-OnPushMutation-Task
npm run dev            # opens the app in your browser (Vite dev server)

# …or, from the repo root:
npm run dev -w 01-OnPushMutation-Task
```

Open the dev tools console — several tasks surface their bug as a console
warning, error, or change-detection complaint (e.g.
`ExpressionChangedAfterItHasBeenCheckedError`), not just a visible DOM glitch.

### Type-check tasks (compile-by-design)

Tasks **27, 28, 29, 30** are **type-check** exercises. Vite (under analog) strips
types and AOT-compiles templates, so `npm run dev` AND `npm run build` succeed
even with type errors. The bug only surfaces when you ask the TS compiler:

```pwsh
npm run typecheck -w 27-InjectionTokenTyping-Task    # tsc --noEmit  → reports the errors
```

Their `-Task` apps fail `tsc --noEmit` by design; their `-Solution` apps pass.

### Checking everything at once (optional)

```pwsh
npm run typecheck:all   # 56 pass, 4 expected failures (27/28/29/30 -Task)
npm run build:all       # 60/60 build (Vite never enforces tsc)
```

## Task index

| #  | Topic | Type | Focus |
|----|-------|------|-------|
| 01 | OnPush + In-Place Mutation | behavioral | OnPush child + parent that mutates an input array (push/sort) and a stats object in place — change detection skipped because reference identity never changes. |
| 02 | Subscription Leak in a Component | behavioral | Bare `subscribe()` without `takeUntilDestroyed`; `ngOnDestroy` tears down the wrong field; a `destroy$` Subject whose `.next()` is never called. |
| 03 | async Pipe Used Multiple Times | behavioral | Same cold HTTP observable bound via `\| async` three times → three HTTP calls, plus a sibling `.subscribe()` and a no-op "refresh" that re-assigns the same reference. |
| 04 | ExpressionChangedAfterItHasBeenCheckedError | behavioral | Child emits during `ngOnInit`/`ngAfterViewInit` and parent writes the bound input synchronously; plus `Math.random()` in an interpolation. |
| 05 | detectChanges vs markForCheck | behavioral | `markForCheck()` called outside the zone (no tick scheduled), `detectChanges()` called in `ngOnInit` (too early), and on a destroyed view (`ViewDestroyedError`). |
| 06 | Work in constructor vs ngOnInit | behavioral | HTTP fired from the constructor (Input still undefined); `ViewChild` read in constructor; interval started without paired `ngOnDestroy` cleanup. |
| 07 | signal.set With Same Object Ref | behavioral | `set()` with the same array/object reference after `push`/mutation; `update()` returning the same reference; `Array.sort()`'s in-place return. |
| 08 | effect() That Writes a Read Signal | behavioral | effect reads + writes the same signal (infinite loop); conditional signal read never tracks; `effect()` created in `ngOnInit` (no injection context). |
| 09 | computed() Reading Non-Reactive Data | behavioral | `computed` reads a plain class field, `localStorage`, and a setter that bypasses the signal API — none of which the reactivity graph tracks. |
| 10 | Nested Subscribes Instead of switchMap | behavioral | Outer subscribe nests an inner subscribe — both leak, results land out of order, and stale loads accumulate into a shared array. |
| 11 | switchMap vs mergeMap vs concatMap | behavioral | mergeMap on autocomplete (out-of-order), switchMap on save (cancelled writes), mergeMap on paged loader (shuffled pages). |
| 12 | Missing shareReplay on a Service | behavioral | Service returns the raw HTTP observable (cold) — every consumer re-fires the request. Plus `Subject` (no replay) for the "ping" stream. |
| 13 | Subject vs BehaviorSubject | behavioral | `Subject<User>` drops the only emission for late subscribers; `Subject<number>` seeded with `next(0)` in the constructor reaches no one. |
| 14 | takeUntil Placement | behavioral | `takeUntil` placed BEFORE `switchMap` / `retry` so the destroy notifier is swallowed; `takeUntilDestroyed()` called outside an injection context (NG0203). |
| 15 | Hot vs Cold Observable Confusion | behavioral | Cold `interval` exposed as if cached; Subject `.next()`-ed before any subscriber; `share()` without a ReplaySubject connector. |
| 16 | Template-driven ngModel Without name | behavioral | `[(ngModel)]` without `name` never registers with the parent `NgForm`; two inputs sharing `name="email"` collide. |
| 17 | Reactive Form Accessed Too Early | behavioral | Template `[formGroup]` evaluated before `this.form = ...` runs in `ngOnInit`; child reads `@Input form` in constructor; `valueChanges` subscribed before the group is built. |
| 18 | FormArray Mutated By Index | behavioral | `controls[i] = new FormControl(...)` and `splice` bypass `FormArray`'s internal bookkeeping; `@for` tracked by `$index` re-binds wrong rows on removal. |
| 19 | valueChanges Writes Back to Form | behavioral | `valueChanges → patchValue` without `emitEvent: false` (infinite loop); validator mutates form state; child setter re-writes on every set. |
| 20 | Router.navigate Relative vs Absolute | behavioral | `navigate(['child'])` without `relativeTo` resolves at root; `['/child']` is unintentionally absolute; default `queryParamsHandling` wipes the query string. |
| 21 | Route Guard Returns Before Subscribe Resolves | behavioral | `CanActivateFn` calls `.subscribe()` and returns `true` synchronously; another guard `.subscribe()`s inside the pipe (leak); a third returns a Promise that never resolves on error. |
| 22 | queryParams Subscription Leak | behavioral | `route.queryParams.subscribe()` with no `takeUntilDestroyed` (climbing handler count); `route.snapshot.queryParams` cached at construction (stale forever). |
| 23 | ViewChild Accessed Too Early | behavioral | `@ViewChild` read in `ngOnInit` (`null`); `@ViewChildren` queried in constructor (empty); a gated child needs `QueryList.changes` to react to its later appearance. |
| 24 | HostListener vs Manual DOM Listener | behavioral | `addEventListener` in `ngOnInit` never removed; `removeEventListener(fn.bind(this))` returns a NEW function each call so removal silently fails. |
| 25 | Pure Pipe Not Recalculating | behavioral | Pure pipes receive arrays mutated in place / Dates mutated in place; an impure transform is declared `pure: true` and its output sticks. |
| 26 | @for Without a Stable Track | behavioral | `track $index` misroutes per-row state on removal; `track value` with non-unique values triggers NG0955; `track Math.random()` rebuilds the list every CD pass. |
| 27 | InjectionToken Typing | **type-check** | `new InjectionToken('CFG')` without the generic — consumers get `unknown`; provider returns an incomplete shape; factory has no return annotation. |
| 28 | ViewChild Generic Typing | **type-check** | `ElementRef` typed as the wrong element; `@ViewChild(Component)` field typed as `ElementRef<Component>`; `@ViewChildren` typed as the raw element instead of `ElementRef`. |
| 29 | Strictly Typed Reactive Forms | **type-check** | `FormControl('')` defaults to `string \| null` vs declared `string`; non-`nonNullable` builder loses non-nullability; pushing a wrong-typed control into a typed `FormArray`. |
| 30 | Generic Component Constraints | **type-check** | Generic component / function / helper accesses fields on `T` without an `extends { … }` constraint — `tsc` rejects every `x.id` / `x.name` access. |

## Conventions when adding or editing tasks

- The 30 topics live in `scripts/manifest.mjs` (the single source of truth). Add
  an entry there, then run `node scripts/scaffold.mjs` to generate the
  boilerplate (`package.json` / `index.html` / `vite.config.ts` / `tsconfig.json` /
  `src/main.ts`) — it never overwrites an existing `src/app.component.ts`.
- Each app is **standalone**: no shared library, no shared service; each
  `src/app.component.ts` stands on its own (mirroring how each React `App.tsx`
  and each JS `main.js` stands alone).
- Behavioral tasks must **misbehave deterministically** — verify by running.
- Solutions annotate every change with `// FIX #n`; tasks lead with the
  `// TASK NN` header block.
- Keep the bug surface on **Angular pitfalls**, not build config. **ESLint /
  @angular-eslint is deliberately not installed** — rules like
  `no-empty-lifecycle-method`, `prefer-on-push-component-change-detection`,
  `use-pipe-transform-interface` would auto-flag several planted bugs and spoil
  the exercise.
