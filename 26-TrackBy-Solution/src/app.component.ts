// =============================================================================
// SOLUTION 26 — @for Without a Stable Track
// =============================================================================
//
// Every change is annotated `// FIX #n`. The track expression is the
// IDENTITY of a row. It must be:
//   - stable across renders (not a fresh object/function each pass),
//   - unique within the current iteration,
//   - cheap to compute (it runs on every CD pass).
// A row's surrogate `id` (or the row reference itself, if rows are
// always-new objects) is the textbook choice.
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
        <!-- FIX #1: track by it.id — stable across removals. The DOM
                     for row B follows row B; the input keeps its text. -->
        @for (it of items; track it.id) {
          <li>{{ it.label }}: <input [value]="it.value" /></li>
        }
      </ul>
      <h2>duplicate values</h2>
      <ul>
        <!-- FIX #2: track by it.id (unique), not by it.value. -->
        @for (it of dupes; track it.id) {
          <li>{{ it.label }} ({{ it.value }})</li>
        }
      </ul>
      <h2>random track</h2>
      <ul>
        <!-- FIX #3: stable track expression so rows don't rebuild every
                     CD pass; inputs keep focus. -->
        @for (it of items; track it.id) {
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
}
