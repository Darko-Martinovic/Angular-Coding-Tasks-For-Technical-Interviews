// =============================================================================
// SOLUTION 22 — queryParams Subscription Leak
// =============================================================================
//
// Every change is annotated `// FIX #n`.
//   - takeUntilDestroyed on every route Observable subscription.
//   - Don't cache `route.snapshot` if you need live values; subscribe to
//     `route.queryParams` (or `paramMap`) and let the latest emission
//     update your local state.
//   - Subscribe to route observables in `ngOnInit` (or constructor — both
//     are post-DI). For most cases this is interchangeable, but a
//     consistent pattern keeps the lifecycle obvious.
// =============================================================================

import { Component, DestroyRef, Injectable, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet, Routes } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class Counters { count = 0; }

@Component({
  selector: 'app-listing',
  standalone: true,
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <p>live queryParams = {{ live | json }}</p>
      <p>live (was 'snapshot') = {{ snapshotParams | json }}</p>
      <p>[listing] queryParams seen this nav = {{ counters.count }}</p>
    </section>
  `,
})
export class ListingComponent implements OnInit {
  live: Record<string, string> = {};
  // FIX #2: live, not snapshot. Driven by the same subscription.
  snapshotParams: Record<string, string> = {};
  private destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, public counters: Counters) {}

  ngOnInit() {
    // FIX #1: takeUntilDestroyed — when the component is destroyed (i.e.
    //         when the router replaces it on navigation), the subscription
    //         dies with it. No more climbing counts.
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        this.live = p as Record<string, string>;
        this.snapshotParams = p as Record<string, string>;
        this.counters.count++;
        console.log('[listing] queryParams =', p);
      });

    // FIX #3: paramMap also subscribed in ngOnInit and torn down on
    //         destroy.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => console.log('[paramMap]', m.get('id')));
  }
}

export const routes: Routes = [
  { path: '', component: ListingComponent },
  { path: 'other', component: ListingComponent },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>queryParams leak</h1>
      <a [routerLink]="['/']" [queryParams]="{tab:'a'}">/?tab=a</a>
      <a [routerLink]="['/']" [queryParams]="{tab:'b'}">/?tab=b</a>
      <a [routerLink]="['/other']" [queryParams]="{tab:'c'}">/other?tab=c</a>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
