// =============================================================================
// TASK 09 — computed() Reading Non-Reactive Data
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page)
//
// `computed()` tracks the signals it READS each run. If a computed reads
// data that isn't a signal — a plain class field, `localStorage`, a global
// — Angular has nothing to subscribe to, so the computed never recomputes.
// This page mixes three flavors of that mistake.
//
// GOAL: Make every `computed` re-derive when its true source-of-truth
//       changes. There are THREE distinct "computed read non-reactively"
//       bugs in here.
//
// THINGS TO SCRUTINISE:
//   1. `priceWithTax = computed(() => this.price * 1.1)` — `price` is a
//      plain field. Mutating it does not notify anyone.
//   2. `themed = computed(() => this.label() + ' (' + localStorage.getItem('theme') + ')')`
//      — localStorage is opaque to the reactivity system.
//   3. `bumpPrice()` assigns `this.price = ...` directly. No signal write
//      → no recompute.
//
// EXPECTED CORRECT BEHAVIOR:
//   - "+ price" raises the displayed `priceWithTax` and the effect logs.
//   - "Toggle theme" updates the `themed` label.
//   - "+ label" updates `themed` (and re-reads the latest theme).
//
// ACTUAL (buggy) BEHAVIOR: `priceWithTax` is permanently 11; toggling the
//   theme does nothing; the effect on `themed` logs once at init.
// =============================================================================

import { Component, computed, effect, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>price w/ tax: {{ priceWithTax() }} | themed: {{ themed() }}</h1>
      <p>raw price = {{ price }}</p>
      <button (click)="bumpPrice()">+ price</button>
      <button (click)="bumpLabel()">+ label</button>
      <button (click)="toggleTheme()">Toggle theme</button>
    </main>
  `,
})
export class AppComponent {
  // BUG: `price` is a plain field — `computed(() => this.price * 1.1)`
  //      reads it but has no signal to subscribe to.
  price = 10;
  label = signal('item');

  priceWithTax = computed(() => this.price * 1.1);

  // BUG: localStorage is opaque to signals — even if `label()` change
  //      re-runs the computed, the theme value won't change because we
  //      stored it outside the reactivity graph.
  themed = computed(() => this.label() + ' (' + (localStorage.getItem('theme') ?? 'light') + ')');

  constructor() {
    localStorage.setItem('theme', 'light');
    effect(() => console.log('[effect themed] =', this.themed()));
  }

  bumpPrice() {
    // BUG: writes the field, not a signal. No reactivity, no recompute.
    this.price += 1;
  }

  bumpLabel() {
    this.label.set(this.label() + '!');
  }

  toggleTheme() {
    const next = localStorage.getItem('theme') === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    // (no signal poked → no recompute)
  }
}
