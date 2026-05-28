// =============================================================================
// TASK 04 — ExpressionChangedAfterItHasBeenCheckedError
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (runs and throws in dev-mode — open the console)
//
// `<app-chart>` exposes a `pointsLoaded` count once it has measured the DOM
// after view init. The parent binds that count to a header label. In Angular
// dev mode (default), this throws `NG0100:
// ExpressionChangedAfterItHasBeenCheckedError` on every paint.
//
// GOAL: Fix it so the header reflects the latest count without the error,
//       and the child no longer mutates a parent-bound input during its own
//       lifecycle. There are MULTIPLE distinct sources of the same error
//       hidden in this small component tree.
//
// THINGS TO SCRUTINISE:
//   1. `ngAfterViewInit` runs AFTER Angular has checked the parent's
//      bindings. If the child synchronously emits and the parent
//      synchronously writes to a bound field, the next CD pass sees a
//      different value than the one just checked — and dev-mode throws.
//   2. The child also has an @Input setter that writes back to a sibling
//      *parent* field via `@Output emit()` during change-detection. That's
//      a re-entrant write to a checked binding.
//   3. The parent reads `Math.random()` inside an interpolation. Each
//      check produces a different value; this expression itself changes
//      "after it has been checked".
//
// EXPECTED CORRECT BEHAVIOR:
//   - The page renders the header "points loaded: N" exactly once after the
//     child measures, with no console error.
//   - Re-rendering on click does not throw.
//
// ACTUAL (buggy) BEHAVIOR: red `ExpressionChangedAfterItHasBeenCheckedError`
//   stack traces in the dev console on every interaction.
// =============================================================================

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div style="height:60px;border:1px dashed #aaa;">chart with {{ size }} points</div>`,
})
export class ChartComponent implements AfterViewInit, OnInit {
  @Input() size = 0;
  @Output() pointsLoaded = new EventEmitter<number>();

  ngOnInit() {
    // BUG: emits during ngOnInit. The parent template has ALREADY been
    //      checked with the initial `loaded = 0`; this synchronous emit then
    //      assigns a non-zero value, causing the dev-mode check to fail.
    this.pointsLoaded.emit(0);
  }

  ngAfterViewInit() {
    // BUG: synchronously emits after view init. The parent's currentValue
    //      for `loaded` has already been recorded for this CD pass — and
    //      we're changing it BEFORE the next pass starts.
    this.pointsLoaded.emit(this.size * 10);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <!-- BUG: Math.random() inside an interpolation — every CD pass produces
           a different value, so dev-mode flags "expression changed". -->
      <h1>points loaded: {{ loaded }} <small>(jitter {{ jitter() }})</small></h1>
      <button (click)="size = size + 1">+ point</button>
      <app-chart [size]="size" (pointsLoaded)="onLoaded($event)" />
    </main>
  `,
})
export class AppComponent {
  size = 3;
  loaded = 0;

  jitter() {
    return Math.random();
  }

  onLoaded(n: number) {
    // BUG: assigning to `loaded` synchronously from the child's lifecycle
    //      emit. The parent has already been checked this tick.
    this.loaded = n;
  }
}
