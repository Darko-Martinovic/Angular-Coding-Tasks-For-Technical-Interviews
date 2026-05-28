// =============================================================================
// SOLUTION 09 — computed() Reading Non-Reactive Data
// =============================================================================
//
// Every change is annotated `// FIX #n`. The rule: a `computed` may only
// read SIGNALS to take part in reactivity. Anything else must be wrapped
// in a signal, and any mutation of that source-of-truth must go through
// `set` / `update`.
// =============================================================================

import { Component, computed, effect, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>price w/ tax: {{ priceWithTax() }} | themed: {{ themed() }}</h1>
      <p>raw price = {{ price() }}</p>
      <button (click)="bumpPrice()">+ price</button>
      <button (click)="bumpLabel()">+ label</button>
      <button (click)="toggleTheme()">Toggle theme</button>
    </main>
  `,
})
export class AppComponent {
  // FIX #1: convert `price` to a signal so `computed` has something to
  //         subscribe to. The template now reads it as `price()`.
  price = signal(10);
  label = signal('item');

  // FIX #2: wrap the localStorage value in a signal too. localStorage isn't
  //         reactive; we mirror its state in a signal and update both
  //         together in toggleTheme().
  theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  );

  priceWithTax = computed(() => this.price() * 1.1);
  themed = computed(() => this.label() + ' (' + this.theme() + ')');

  constructor() {
    effect(() => console.log('[effect themed] =', this.themed()));
  }

  bumpPrice() {
    // FIX #3: go through the signal API; this notifies dependents.
    this.price.update((p) => p + 1);
  }

  bumpLabel() {
    this.label.set(this.label() + '!');
  }

  toggleTheme() {
    // Update both the in-graph signal AND the persistent store. The signal
    // is the source of truth for reactivity; localStorage is the persistent
    // mirror for next-page-load.
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('theme', next);
  }
}
