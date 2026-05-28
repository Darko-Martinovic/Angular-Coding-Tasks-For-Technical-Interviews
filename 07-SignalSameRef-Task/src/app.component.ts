// =============================================================================
// TASK 07 — signal.set With Same Object Ref
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page)
//
// A small "shopping list" page uses signals: `items: signal<string[]>`,
// `cart: signal<{ count: number, total: number }>`. There's also a
// `computed` `length = computed(() => items().length)` and an `effect` that
// logs whenever `items` changes. Click any of Add / Bump / Reorder and the
// view sticks; the effect never logs after the first emission.
//
// GOAL: Make every signal update propagate. There are THREE distinct
//       same-reference traps.
//
// THINGS TO SCRUTINISE:
//   1. Angular's signal change detection is `Object.is`. After
//      `arr.push(x); items.set(arr)`, what is `Object.is(prev, arr)`?
//   2. `cart.update(c => { c.count++; return c; })` — what does the updater
//      return? The same `c` reference?
//   3. `items.set(items().sort())` — `Array.prototype.sort` mutates in
//      place AND returns the same reference; the set call effectively asks
//      "did this change?" "no".
//
// EXPECTED CORRECT BEHAVIOR:
//   - "Add" appends an item; `length` increments; effect logs.
//   - "Bump" increments `cart.count` in the view; an effect on `cart` logs.
//   - "Reorder" reverses the list visibly.
//
// ACTUAL (buggy) BEHAVIOR: the page reflects nothing after the first paint;
//   effects fire only at component init.
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
    effect(() => {
      const xs = this.items();
      console.log('[effect items] length =', xs.length);
    });
    effect(() => {
      const c = this.cart();
      console.log('[effect cart] count =', c.count);
    });
  }

  add() {
    // BUG: push mutates the array and returns the new length. set() then
    //      receives the SAME reference — Object.is(prev, prev) is true, so
    //      no notification. Computed `length` stays stale.
    const arr = this.items();
    arr.push(`item-${this.nextId++}`);
    this.items.set(arr);
  }

  bump() {
    // BUG: update()'s callback mutates the object IN PLACE and returns the
    //      same reference. signal change detection sees no change, the
    //      `cart` effect never re-fires, the view doesn't update.
    this.cart.update((c) => {
      c.count++;
      c.total = c.count * 10;
      return c;
    });
  }

  reorder() {
    // BUG: Array.prototype.sort sorts in place AND returns the same array
    //      reference. set() is given the same reference it already had.
    this.items.set(this.items().sort((a, b) => b.localeCompare(a)));
  }
}
