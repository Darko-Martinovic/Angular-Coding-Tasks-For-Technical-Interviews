// =============================================================================
// SOLUTION 07 — signal.set With Same Object Ref
// =============================================================================
//
// Every change is annotated `// FIX #n`. Signal change detection uses
// `Object.is`. Always set / update with a NEW reference, even if the
// "shape" is identical — the previous test passes only when literally the
// same object comes back.
// =============================================================================

import { Component, computed, effect, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Shopping ({{ length() }} items)</h1>
      <button (click)="add()">Add</button>
      <button (click)="bump()">Bump count</button>
      <button (click)="reorder()">Reorder</button>
      <ul>
        @for (it of items(); track it) { <li>{{ it }}</li> }
      </ul>
      <p>cart count: {{ cart().count }} | total: {{ cart().total }}</p>
    </main>
  `,
})
export class AppComponent {
  items = signal<string[]>(['eggs', 'bread']);
  cart = signal<{ count: number; total: number }>({ count: 0, total: 0 });
  length = computed(() => this.items().length);
  private nextId = 1;

  constructor() {
    effect(() => console.log('[effect items] length =', this.items().length));
    effect(() => console.log('[effect cart] count =', this.cart().count));
  }

  add() {
    // FIX #1: spread into a new array so set() receives a fresh reference;
    //         Object.is(prev, next) is now false, all dependents recompute.
    this.items.set([...this.items(), `item-${this.nextId++}`]);
  }

  bump() {
    // FIX #2: return a NEW object from the updater. The callback's contract
    //         is "give me back the next value" — if you give back the same
    //         reference, signals consider it unchanged.
    this.cart.update((c) => ({ ...c, count: c.count + 1, total: (c.count + 1) * 10 }));
  }

  reorder() {
    // FIX #3: copy-then-sort. `[...arr]` creates a new array; the in-place
    //         sort mutates that copy. set() sees a different reference.
    //         (Equivalent: `toSorted` from ES2023.)
    this.items.set([...this.items()].sort((a, b) => b.localeCompare(a)));
  }
}
