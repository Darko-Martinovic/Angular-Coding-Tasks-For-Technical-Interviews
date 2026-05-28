// =============================================================================
// TASK 01 — OnPush + In-Place Mutation
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (runs in the browser and misbehaves — open the page)
//
// A parent renders a child `<app-list>` whose ChangeDetectionStrategy is
// OnPush. The parent has THREE mutating actions: Add an item, Sort the list,
// and Bump the count in a stats object. None of them are visible in the child
// after the very first render — but the parent's own "raw" preview (which is
// Default change detection) reflects every click immediately.
//
// GOAL: Fix ALL the bugs so the child's view updates on every click. There
//       are THREE distinct OnPush pitfalls, each in a different shape of
//       state mutation. (No, just `markForCheck()` everywhere is not the
//       intended fix — fix the cause, not the symptom.)
//
// THINGS TO SCRUTINISE:
//   1. The child uses OnPush. What conditions actually trigger OnPush to run
//      change detection on the child? Reference identity of inputs is one.
//   2. `items` is bound as `[items]="items"`. After `items.push(x)`, what is
//      the IDENTITY of that array? Did the @Input setter (or any DoCheck)
//      see a new value?
//   3. `stats` is a small object. After `stats.count++`, what is the IDENTITY
//      of `stats`? The number inside changed; the reference did not.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Clicking "Add" appends a new item that appears in the child's <ul>.
//   - Clicking "Sort" reorders the child's <ul> alphabetically.
//   - Clicking "Bump" increments the count rendered by the child.
//   - Each click also logs `[child] ngOnChanges` for the input that changed.
//
// ACTUAL (buggy) BEHAVIOR: the parent's raw preview updates on every click;
//   the OnPush child is frozen on whatever it rendered first. No
//   ngOnChanges fires after the initial bind. (Check the console.)
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
    // BUG: push mutates in place — `this.items` is the SAME reference, so the
    //      OnPush child's @Input setter never fires and CD is skipped.
    this.items.push(`item-${this.next++}`);
  }

  sort() {
    // BUG: Array.prototype.sort sorts in place and returns the same array
    //      reference — again no new identity, OnPush skips.
    this.items.sort();
  }

  bump() {
    // BUG: incrementing a property on the same `stats` object does not change
    //      the object's reference; OnPush input check (===) sees no change.
    this.stats.count++;
  }
}
