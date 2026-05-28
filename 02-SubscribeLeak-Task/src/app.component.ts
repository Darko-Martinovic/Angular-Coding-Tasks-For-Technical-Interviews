// =============================================================================
// TASK 02 — Subscription Leak in a Component
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (runs and misbehaves — open the console)
//
// `LeakyComponent` subscribes to three observables in ngOnInit. The parent
// has a "Toggle" button that adds/removes the child from the DOM. After you
// click Toggle a few times, the console keeps logging from ALL the destroyed
// instances — the subscriptions outlive the components.
//
// GOAL: Fix ALL the bugs so that destroying the component stops every
//       subscription it created. There are THREE distinct leaks, each with a
//       different cause. Modernize: use takeUntilDestroyed for the Rx side.
//
// THINGS TO SCRUTINISE:
//   1. The bare `interval(1000).subscribe(...)` has no teardown anywhere.
//      What does Angular do for you when the component is destroyed? Nothing.
//   2. There is a Subject + a `clicks$.subscribe(...)`. The code "unsubscribes"
//      in ngOnDestroy, but does it unsubscribe the RIGHT thing?
//   3. There is a `destroy$ = new Subject<void>()` and a `takeUntil(destroy$)`
//      pipe — is `destroy$.next(); destroy$.complete()` ever actually called?
//
// EXPECTED CORRECT BEHAVIOR:
//   - After Toggle removes the child, NO further `[N] tick`/`[N] click`/`[N]
//     pulse` log lines for that instance are printed.
//   - Re-toggling re-creates an instance with a fresh counter.
//
// ACTUAL (buggy) BEHAVIOR: every Toggle leaves behind a zombie that keeps
//   logging forever. After 3 toggles the console gets 3× the ticks/sec.
// =============================================================================

import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

let nextId = 1;

@Component({
  selector: 'app-leaky',
  standalone: true,
  template: `<p>leaky instance #{{ id }} alive</p>`,
})
export class LeakyComponent implements OnInit, OnDestroy {
  readonly id = nextId++;
  private clicks$ = new Subject<MouseEvent>();
  private pulse$ = new Subject<number>();
  private destroy$ = new Subject<void>();
  private clicksSub?: Subscription;
  private intervalSub?: Subscription;

  ngOnInit() {
    // BUG: no teardown anywhere — interval keeps emitting after destroy.
    interval(1000).subscribe((n) => console.log(`[${this.id}] tick`, n));

    // BUG: ngOnDestroy unsubscribes `intervalSub` instead of `clicksSub`,
    //      because the field names got swapped at some point. The clicks
    //      subscription stays alive forever, even though we *intended* to
    //      clean it up.
    this.clicksSub = this.clicks$.subscribe((e) =>
      console.log(`[${this.id}] click`, (e.target as HTMLElement)?.tagName),
    );

    // BUG: takeUntil(destroy$) looks safe — but `destroy$.next()` is never
    //      called and the subject is never completed, so the pipe stays open
    //      for the lifetime of the page.
    this.pulse$.pipe(takeUntil(this.destroy$)).subscribe((p) =>
      console.log(`[${this.id}] pulse`, p),
    );

    // a long-running source firing into the leaked pulse subscription
    setInterval(() => this.pulse$.next(this.id), 1500);
    // a window-level handler firing into the leaked clicks subscription
    window.addEventListener('click', (e) => this.clicks$.next(e));
  }

  ngOnDestroy() {
    // BUG (2nd half): the wrong subscription is being torn down here.
    this.intervalSub?.unsubscribe();
    // and we never signal the destroy$ subject either.
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LeakyComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Subscription Leak</h1>
      <button (click)="visible = !visible">Toggle</button>
      @if (visible) { <app-leaky /> }
      <p style="color: #888;">Click Toggle a few times, watch the console — zombie ticks pile up.</p>
    </main>
  `,
})
export class AppComponent {
  visible = true;
}
