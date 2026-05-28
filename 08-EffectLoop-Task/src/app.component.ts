// =============================================================================
// TASK 08 — effect() That Writes a Read Signal
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console — three distinct symptoms)
//
// Three effect-related bugs:
//   - one effect reads a signal and writes back to the SAME signal → loop,
//     Angular eventually throws (NG0103: infinite change detection cycles).
//   - one effect conditionally reads a signal, so it doesn't track it on
//     the first run and never re-fires when it changes.
//   - one effect() is created inside `ngOnInit`, which is not an injection
//     context — Angular throws NG0203 at runtime.
//
// GOAL: Make all three effects do what they say on the tin without looping,
//       missing updates, or throwing on init.
//
// THINGS TO SCRUTINISE:
//   1. `effect(() => count.set(count() + 1))` — reads count, then writes
//      count. Each write re-runs the effect. Forever.
//   2. `effect(() => { if (enabled()) console.log(value()); })` — when
//      `enabled()` is false on the first run, the effect never reads
//      `value()` and never subscribes to it. Even after `enabled()`
//      becomes true, changing `value()` does not trigger the effect.
//   3. `ngOnInit() { effect(...) }` — effect() must be called in an
//      injection context (constructor, field initializer, or via
//      `Injector.runInContext`).
//
// EXPECTED CORRECT BEHAVIOR:
//   - "Bump count" increments by 1 per click, no loop.
//   - With `enabled` on, every value change logs from the effect.
//   - The page boots without NG0203.
//
// ACTUAL (buggy) BEHAVIOR: NG0103 in console; the "value" effect never
//   fires for value changes; an assertion throw on the first render.
// =============================================================================

import { Component, OnInit, effect, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Effects: count = {{ count() }}, value = {{ value() }}, enabled = {{ enabled() }}</h1>
      <button (click)="count.set(count() + 1)">Bump count</button>
      <button (click)="value.set(value() + 1)">Bump value</button>
      <button (click)="enabled.set(!enabled())">Toggle enabled</button>
    </main>
  `,
})
export class AppComponent implements OnInit {
  count = signal(0);
  value = signal(0);
  enabled = signal(false);

  constructor() {
    // BUG: read AND write the same signal in one effect → infinite loop.
    //      Each set re-runs the effect, which writes again, …
    effect(() => {
      const c = this.count();
      this.count.set(c + 1);
    });

    // BUG: conditional read inside the effect. The first run sees
    //      enabled()=false and never reads value(), so the effect doesn't
    //      depend on value() at all. Even after enabled flips to true, a
    //      `value.set(...)` won't re-trigger this effect.
    effect(() => {
      if (this.enabled()) {
        console.log('[effect value] =', this.value());
      }
    });
  }

  ngOnInit() {
    // BUG: effect() requires an injection context. ngOnInit is NOT one —
    //      at runtime Angular throws NG0203 "inject() must be called from
    //      an injection context".
    effect(() => console.log('[effect onInit] enabled =', this.enabled()));
  }
}
