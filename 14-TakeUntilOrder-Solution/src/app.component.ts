// =============================================================================
// SOLUTION 14 — takeUntil Placement
// =============================================================================
//
// Every change is annotated `// FIX #n`. Rule: `takeUntil(destroy$)` (or
// `takeUntilDestroyed()`) must be LAST in the pipe. It then sees the final
// observable of the chain — including anything produced by switchMap or
// retry — and unsubscribes the whole thing on destroy.
//
// `takeUntilDestroyed()` reads from an injection context. Call it in the
// constructor (or pass a DestroyRef obtained there) to use it inside
// methods.
// =============================================================================

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, throwError } from 'rxjs';
import { catchError, retry, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-leaky',
  standalone: true,
  template: `<p>leaky child alive</p>`,
})
export class LeakyComponent implements OnInit {
  private clicks$ = new Subject<void>();
  // FIX #3: capture DestroyRef in the constructor (an injection context),
  //         then thread it into takeUntilDestroyed() from any method.
  private destroyRef = inject(DestroyRef);

  start() {
    interval(700)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((n) => console.log('[click-int]', n));
    this.clicks$.next();
  }

  ngOnInit() {
    // FIX #1: takeUntilDestroyed LAST in the pipe. The inner interval
    //         produced by switchMap is now properly unsubscribed on destroy.
    this.clicks$
      .pipe(
        switchMap(() => interval(500)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((n) => console.log('[int]', n));

    // FIX #2: takeUntilDestroyed AFTER retry. The retry's resubscription
    //         chain now also flows through takeUntilDestroyed, so destroy
    //         tears the whole thing down.
    interval(300)
      .pipe(
        switchMap(() => throwError(() => new Error('boom'))),
        retry({ count: Infinity, delay: 200 }),
        catchError(() => []),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
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
    const el = document.querySelector('app-leaky');
    (el as any)?.__ngContext__?.[8]?.start?.();
  }
}
