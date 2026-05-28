// =============================================================================
// TASK 26 — @for Without a Stable Track
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page; type in one input then reorder)
//
// Two `@for` loops:
//   - one tracks by `$index` — when you remove item 0, every row's
//     `<input>` re-binds to the row that USED to be at index+1, so the
//     text you typed appears under the wrong item.
//   - one tracks by the item's `.value` field where the values are not
//     unique — Angular throws "NG0955: Duplicate keys found".
// A third nested list reads `Math.random()` as the track key, producing
// a different value every render so every row is destroyed/recreated and
// inputs lose focus on each keystroke.
//
// GOAL: Pick a stable, unique identity for each row. A surrogate `id`
//       field is the textbook choice.
//
// THINGS TO SCRUTINISE:
//   1. `track $index` is almost always wrong for editable lists.
//   2. `track value` only works when the value is GUARANTEED unique.
//   3. `track Math.random()` is the canonical "force-rebuild" mistake.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Type "X" into row B's input, Remove A: "X" stays in row B.
//   - No duplicate-key console error.
//   - Typing into the nested list does not steal focus on each char.
//
// ACTUAL (buggy) BEHAVIOR: removal misroutes the typed text; duplicate
//   keys error in dev mode; nested list inputs lose focus per keystroke.
// =============================================================================

import { Component } from '@angular/core';

interface Item { id: number; label: string; value: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>@for track</h1>
      <button (click)="removeFirst()">Remove first</button>
      <ul>
        <!-- BUG: track $index — removing index 0 re-binds inputs to wrong rows. -->
        @for (it of items; track $index) {
          <li>{{ it.label }}: <input [value]="it.value" /></li>
        }
      </ul>
      <h2>duplicate values</h2>
      <ul>
        <!-- BUG: track it.value, but values are not unique → NG0955. -->
        @for (it of dupes; track it.value) {
          <li>{{ it.label }} ({{ it.value }})</li>
        }
      </ul>
      <h2>random track</h2>
      <ul>
        <!-- BUG: random key every render → entire list rebuilt each CD pass. -->
        @for (it of items; track random()) {
          <li><input [value]="it.label" /></li>
        }
      </ul>
    </main>
  `,
})
export class AppComponent {
  items: Item[] = [
    { id: 1, label: 'A', value: '' },
    { id: 2, label: 'B', value: '' },
    { id: 3, label: 'C', value: '' },
  ];
  dupes: Item[] = [
    { id: 1, label: 'one',   value: 'x' },
    { id: 2, label: 'two',   value: 'x' },
    { id: 3, label: 'three', value: 'y' },
  ];

  removeFirst() { this.items = this.items.slice(1); }
  random() { return Math.random(); }
}
