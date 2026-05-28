// =============================================================================
// TASK 05 — detectChanges vs markForCheck
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// `ChildComponent` is OnPush. It has three places where it tries to push a
// state change into the view — and every one of them chose the wrong tool
// from the `ChangeDetectorRef` API. Open the page, click around, and the
// view will be one tick behind, frozen, or throw `ViewDestroyedError`.
//
// GOAL: Fix ALL the bugs by choosing the right CD action for each call site.
//       Hint: `markForCheck()` is asynchronous — it just marks the path to
//       root dirty and waits for the next scheduled CD pass. `detectChanges()`
//       is synchronous — it re-runs CD for THIS view immediately.
//
// THINGS TO SCRUTINISE:
//   1. There's a `setTimeout` running outside Angular's zone (via
//      `ngZone.runOutsideAngular`). When that callback fires, who schedules
//      a CD pass? `markForCheck()` alone won't — it relies on someone
//      else's tick.
//   2. There's a `detectChanges()` call in `ngOnInit`. That re-checks the
//      view before initial bindings have been settled — at best a wasted
//      pass, at worst it throws `ExpressionChanged…`.
//   3. There's a subscription that may fire AFTER the component has been
//      destroyed (you can trigger this by clicking Toggle then Trigger).
//      `detectChanges()` on a destroyed view throws `ViewDestroyedError`.
//
// EXPECTED CORRECT BEHAVIOR:
//   - "Tick (outside zone)" updates the count within ~1s.
//   - No "ExpressionChangedAfter…" on initial render.
//   - Triggering an emit after Toggle hides the child does not throw.
//
// ACTUAL (buggy) BEHAVIOR: the outside-zone count is stuck; the console has
//   a NG0100 on first paint; a post-destroy emit throws ViewDestroyedError.
// =============================================================================

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';

const trigger$ = new Subject<number>();

@Component({
  selector: 'app-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <p>tick: <strong>{{ tick }}</strong></p>
      <p>last emit: <strong>{{ last }}</strong></p>
    </section>
  `,
})
export class ChildComponent implements OnInit, OnDestroy {
  tick = 0;
  last = 0;
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private intervalHandle?: ReturnType<typeof setInterval>;
  private sub = trigger$.subscribe((n) => {
    this.last = n;
    // BUG: when the subject emits after this child has been destroyed (e.g.
    //      because the parent toggled it away), detectChanges() throws
    //      "Attempt to use a destroyed view: detectChanges". The subscription
    //      itself was also never torn down — that's a separate symptom.
    this.cdr.detectChanges();
  });

  ngOnInit() {
    // BUG: detectChanges() inside ngOnInit re-runs CD before initial bindings
    //      have settled. In dev mode this can produce NG0100; even when it
    //      doesn't, it's redundant work.
    this.cdr.detectChanges();

    this.zone.runOutsideAngular(() => {
      this.intervalHandle = setInterval(() => {
        this.tick++;
        // BUG: markForCheck() only schedules a CD pass on the NEXT tick — but
        //      we're outside Angular's zone, so no tick is ever scheduled.
        //      The view never updates. The right call is detectChanges() (to
        //      run CD now) or wrap the write in `zone.run(...)`.
        this.cdr.markForCheck();
      }, 1000);
    });
  }

  ngOnDestroy() {
    if (this.intervalHandle !== undefined) clearInterval(this.intervalHandle);
    // BUG (relates to #1): forgot to also unsubscribe from trigger$.
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChildComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>detectChanges vs markForCheck</h1>
      <button (click)="visible = !visible">Toggle</button>
      <button (click)="trigger()">Trigger emit</button>
      @if (visible) { <app-child /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
  private next = 1;
  trigger() { trigger$.next(this.next++); }
}
