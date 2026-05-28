# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interview question bank: **30 self-contained Angular debugging/fixing tasks** aimed at L4/advanced
developers. Each task is designed to be solved in **under 10 minutes** and deliberately contains
**multiple distinct bugs** (not a single fix). This is teaching material, not an application — there is
no shared library and each app's `src/app.component.ts` stands alone. It mirrors the sibling React bank
in `../ReactCodingTask` and the sibling vanilla-JS bank in `../JavaScriptCodingTasks`.

**TypeScript only. Angular 21+, standalone components only, no `NgModule`.** Signals, the new control
flow (`@if` / `@for` / `@switch`), and the `inject()` function are the default idioms — bugs are planted
on idiomatic Angular semantics, not on legacy patterns.

## Structure

Each of the 30 topics ships as **two runnable Vite apps** (60 apps total), living in folders at the repo
root named `NN-Topic-Task` and `NN-Topic-Solution` (`NN` = `01`..`30`, zero-padded):

- `NN-Topic-Task` — a `// TASK NN` header comment block at the top of `src/app.component.ts`
  (difficulty, target time, goal, "things to scrutinise" hints, EXPECTED correct behavior) above
  starting code that **runs and misbehaves**, or (for the four type-check topics) **fails `tsc --noEmit`
  by design**.
- `NN-Topic-Solution` — the worked fix, with **every change annotated `// FIX #n`** referencing the
  specific bug it addresses.

`README.md` indexes all 30 (number / topic / type / focus). `scripts/manifest.mjs` is the **single
source of truth** for the topic list — keep both in sync when adding tasks.

## The npm workspace (one install, not 60×)

The repo root is an npm **workspace** (`"workspaces": ["*-Task", "*-Solution"]`). All shared
dependencies (`@angular/*`, rxjs, zone.js, vite, `@analogjs/vite-plugin-angular`, typescript) are
declared **once** in the **root** `package.json`. npm hoists them into a single root `node_modules`; the
per-app folders declare **no** dependencies and resolve everything by walking up the tree. So:

- `npm install` is run **once at the repo root**. Never run install inside an app folder.
- There is exactly **one** `node_modules` (at the root), not one per app.
- Shared config is also centralized: every app's `vite.config.ts` re-exports the root
  `vite.config.shared.ts`, and every app's `tsconfig.json` extends the root `tsconfig.base.json`.

## Build & run

Per-app workflow (the normal one). `cwd` is the app folder, so Vite's `root` is that folder:

```pwsh
cd 01-OnPushMutation-Task && npm run dev    # observe the bug in the browser
# or, from the repo root, by workspace name:
npm run dev -w 01-OnPushMutation-Solution   # see the corrected behavior
```

Each app's `package.json` has `dev` (vite), `build` (vite build), `preview`, and `typecheck`
(`tsc --noEmit`).

Root convenience scripts: `npm run typecheck:all` and `npm run build:all` iterate every app
(`scripts/*.mjs`).

## Behavioral vs type-check tasks

- **26 behavioral** tasks (01–26): the bug is observable at runtime — a wrong DOM render, an
  `ExpressionChangedAfterItHasBeenCheckedError`, an unsubscribed leak, OnPush not refreshing, a signal
  not notifying, an RxJS race with visibly wrong ordering, an infinite change-detection cycle, etc.
  These are meant to be *run*.
- **4 type-check** tasks (27–30): the bug is a TypeScript correctness issue. Vite (under analog)
  strips types and AOT-compiles templates, so `npm run dev` AND `npm run build` succeed even with
  type errors — only `tsc --noEmit` reports them. The exercise is therefore to make
  **`npm run typecheck -w NN-Foo-Task`** pass. `npm run typecheck:all` expects exactly those four
  `-Task` apps to fail and everything else (every `-Solution` + every behavioral `-Task`) to pass.
  `npm run build:all` expects every app to build.

## Conventions when adding or editing tasks

- Add the topic to `scripts/manifest.mjs`, then run `node scripts/scaffold.mjs` to generate the
  boilerplate. It is idempotent and **never overwrites an existing `src/app.component.ts`** — write the
  real content there yourself.
- `src/app.component.ts` must `export class AppComponent` decorated with `@Component({ selector:
  'app-root', standalone: true, ... })`. The generated `src/main.ts` calls
  `bootstrapApplication(AppComponent, ...)`. Inline `template:` and `styles:` keep the entry file
  self-contained — the same idea as keeping React's `App.tsx` self-contained.
- Behavioral tasks should keep `tsc` clean (use `!` to silence a strict-null check where the *runtime*
  null-deref IS the intended bug) so that only 27/28/29/30 fail type-checking.
- Keep the bug surface on **Angular/RxJS pitfalls**, not build config. ESLint / `@angular-eslint` is
  deliberately omitted — rules like `no-empty-lifecycle-method`,
  `prefer-on-push-component-change-detection`, `use-pipe-transform-interface` would flag several bugs
  and spoil them.
- Solutions annotate every change with `// FIX #n`; tasks lead with the `// TASK NN` header block.
- **Multiple distinct bugs per task** — spread across the code, not clustered in one line.
