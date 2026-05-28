// =============================================================================
// SOLUTION 02 — Subscription Leak in a Component
// =============================================================================
//
// Every change is annotated `// FIX #n`. The modern fix is to thread
// `takeUntilDestroyed()` (Angular 16+) into every pipe — it ties the
// subscription's lifetime to the component's DestroyRef automatically. The
// global event listener also has to be removed in ngOnDestroy.
// =============================================================================

import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject } from 'rxjs';

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
  // FIX #1: We no longer need a manually-managed destroy$ — Angular's
  //         DestroyRef gives takeUntilDestroyed() a notifier for free.
  private destroyRef = inject(DestroyRef);
  private intervalHandle?: ReturnType<typeof setInterval>;
  private clickHandler = (e: MouseEvent) => this.clicks$.next(e);

  ngOnInit() {
    // FIX #1: takeUntilDestroyed() is the modern fix for the bare subscribe —
    //         it auto-tears down on component destroy. No more Subscription
    //         field, no manual unsubscribe.
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((n) => console.log(`[${this.id}] tick`, n));

    // FIX #2: Tie the clicks subscription to the component lifetime in the
    //         same way — no need to track which Subscription field belongs
    //         to which stream, no more risk of unsubscribing the wrong one.
    this.clicks$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => console.log(`[${this.id}] click`, (e.target as HTMLElement)?.tagName));

    // FIX #3: Drop the home-grown destroy$ entirely — takeUntilDestroyed
    //         replaces it. Equivalent to using `destroy$.next()` /
    //         `complete()` in ngOnDestroy, but you can't forget to call it.
    this.pulse$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => console.log(`[${this.id}] pulse`, p));

    // Non-Rx leaks still need their own teardown. Save the handles so we can
    // clear them in ngOnDestroy.
    this.intervalHandle = setInterval(() => this.pulse$.next(this.id), 1500);
    window.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy() {
    // FIX #4 (out-of-band): tear down the non-Rx sources we created.
    if (this.intervalHandle !== undefined) clearInterval(this.intervalHandle);
    window.removeEventListener('click', this.clickHandler);
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
      <p style="color: #888;">Toggle: every destroyed instance is silent.</p>
    </main>
  `,
})
export class AppComponent {
  visible = true;
}
