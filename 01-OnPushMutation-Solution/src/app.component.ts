// =============================================================================
// SOLUTION 01 — OnPush + In-Place Mutation
// =============================================================================
//
// Every change is annotated `// FIX #n`. Each mutation now produces a NEW
// reference for the @Input it feeds, so the OnPush child's input check sees
// a change, ngOnChanges fires, and CD runs.
// =============================================================================

import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

interface Stats { count: number; }

@Component({
  selector: 'app-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section style="border: 1px solid #888; padding: 12px; margin-top: 12px;">
      <h3>Child (OnPush)</h3>
      <p>count = <strong>{{ stats.count }}</strong></p>
      <ul>
        @for (it of items; track it) {
          <li>{{ it }}</li>
        }
      </ul>
    </section>
  `,
})
export class ListComponent implements OnChanges {
  @Input() items: string[] = [];
  @Input() stats: Stats = { count: 0 };

  ngOnChanges(changes: SimpleChanges) {
    console.log('[child] ngOnChanges', Object.keys(changes));
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>OnPush + In-Place Mutation</h1>
      <p>
        <button (click)="add()">Add</button>
        <button (click)="sort()">Sort</button>
        <button (click)="bump()">Bump</button>
      </p>
      <p style="color: #888;">parent raw preview: items={{ items.join(',') }} | count={{ stats.count }}</p>
      <app-list [items]="items" [stats]="stats"></app-list>
    </main>
  `,
})
export class AppComponent {
  items: string[] = ['pear', 'apple', 'banana'];
  stats: Stats = { count: 0 };
  private next = 1;

  add() {
    // FIX #1: Replace push (mutates in place) with a NEW array. The @Input
    //         identity changes, so the OnPush child's input check fires.
    this.items = [...this.items, `item-${this.next++}`];
  }

  sort() {
    // FIX #2: Copy-then-sort. `[...arr]` produces a new array; the in-place
    //         sort then mutates that copy, not the original. The assignment
    //         swaps in a new reference.
    this.items = [...this.items].sort();
  }

  bump() {
    // FIX #3: Replace the `stats` object with a new one rather than mutating
    //         the existing object's `count` property. Reference changes →
    //         OnPush input check sees a change.
    this.stats = { ...this.stats, count: this.stats.count + 1 };
  }
}
