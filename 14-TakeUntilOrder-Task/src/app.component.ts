// =============================================================================
// TASK 14 — takeUntil Placement
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// Three pipes, each putting `takeUntil(destroy$)` in the WRONG position so
// the teardown signal is swallowed. The component looks like it's cleaning
// up — but the inner observables stay subscribed after destroy and keep
// emitting into a destroyed view.
//
// GOAL: Move takeUntil to the LAST position in each pipe so it unsubscribes
//       the entire upstream chain — including any inner observables produced
//       by switchMap / retry / mergeMap.
//
// THINGS TO SCRUTINISE:
//   1. `clicks$.pipe(takeUntil(destroy$), switchMap(() => interval(500)))`
//      — when destroy$ fires, the OUTER subscription dies, but the INNER
//      `interval(500)` produced by the last switchMap is still alive and
//      keeps emitting forever.
//   2. `source$.pipe(takeUntil(destroy$), retry({ count: 3 }))` — retry
//      catches errors AND resubscribes. The fresh resubscription is a
//      brand-new piece of pipeline that no longer includes `takeUntil` (it
//      was before the retry). The destroy signal can't reach it.
//   3. `takeUntilDestroyed()` (no argument) only works in an injection
//      context. Calling it from a method on `this` outside that context
//      throws "inject() must be called from an injection context".
//
// EXPECTED CORRECT BEHAVIOR:
//   - Clicking Start spawns an interval (you see [int] N logs).
//   - Clicking Toggle to destroy the component STOPS the interval logs.
//   - No NG0203 in the console.
//
// ACTUAL (buggy) BEHAVIOR: destroying the component does NOT stop the
//   interval; NG0203 fires when start() is called.
// =============================================================================

import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval, throwError } from 'rxjs';
import { catchError, retry, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-leaky',
  standalone: true,
  template: `<p>leaky child alive</p>`,
})
export class LeakyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private clicks$ = new Subject<void>();
  start() {
    // BUG: takeUntilDestroyed() requires an injection context (constructor
    //      or field init). Called from a method, it throws NG0203.
    interval(700)
      .pipe(takeUntilDestroyed())
      .subscribe((n) => console.log('[click-int]', n));
    this.clicks$.next();
  }

  ngOnInit() {
    // BUG: takeUntil BEFORE switchMap. The destroy signal kills the OUTER
    //      subscription but the inner interval keeps running.
    this.clicks$
      .pipe(takeUntil(this.destroy$), switchMap(() => interval(500)))
      .subscribe((n) => console.log('[int]', n));

    // BUG: takeUntil BEFORE retry. retry() resubscribes to the upstream;
    //      the resubscription is a new chain that doesn't include the
    //      destroy notifier — so destroy$ never reaches it again.
    interval(300)
      .pipe(
        switchMap(() => throwError(() => new Error('boom'))),
        takeUntil(this.destroy$),
        retry({ count: Infinity, delay: 200 }),
        catchError(() => []),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LeakyComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>takeUntil Placement</h1>
      <button (click)="visible = !visible">Toggle</button>
      <button (click)="start()">Start</button>
      @if (visible) { <app-leaky #c /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
  start() {
    // Reach into the rendered child (via a quick re-create cycle here for
    // demo simplicity). In a real app the child exposes a method via an
    // EventEmitter or @ViewChild.
    const el = document.querySelector('app-leaky');
    (el as any)?.__ngContext__?.[8]?.start?.(); // best-effort; the symptom is what matters
  }
}
