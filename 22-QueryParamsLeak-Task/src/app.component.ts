// =============================================================================
// TASK 22 — queryParams Subscription Leak
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console; click the links repeatedly)
//
// `<app-listing>` reads `route.queryParams` and `route.paramMap`. The
// counter "[listing] queryParams seen" climbs by one for every navigation
// — even though the component itself is re-created on each navigation, the
// previously-subscribed callbacks are still alive somewhere (they're
// attached to the singleton ActivatedRoute observables).
//
// GOAL: Tear down the subscriptions on destroy, and don't cache the
//       snapshot in the constructor where it will be the FIRST navigation's
//       value forever.
//
// THINGS TO SCRUTINISE:
//   1. `route.queryParams.subscribe(...)` with no `takeUntilDestroyed`
//      survives across navigations because each component instance attaches
//      a NEW subscription and the router lives forever.
//   2. `this.snapshotParams = route.snapshot.queryParams` taken in the
//      constructor — captured once. The next navigation's snapshot is a
//      different object; this field never updates.
//   3. `route.paramMap.subscribe(...)` called inside the constructor — by
//      then the component is being created BEFORE the route is fully
//      resolved in some flows, so it may miss the first emission.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Each navigation logs the queryParams ONCE per component instance.
//   - The "snapshot" view updates with every navigation.
//   - After destroying the component (navigating away), no more logs.
//
// ACTUAL (buggy) BEHAVIOR: per-navigation log count climbs (1, 2, 3, …);
//   snapshot field is stuck on its first value.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet, Routes } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class Counters { count = 0; }

@Component({
  selector: 'app-listing',
  standalone: true,
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <p>live queryParams = {{ live | json }}</p>
      <p>snapshot (captured once at construction) = {{ snapshotParams | json }}</p>
      <p>[listing] queryParams seen this nav = {{ counters.count }}</p>
    </section>
  `,
})
export class ListingComponent implements OnInit {
  live: Record<string, string> = {};
  snapshotParams: Record<string, string>;

  constructor(private route: ActivatedRoute, public counters: Counters) {
    // BUG: snapshot read once at construction — every later navigation
    //      that creates this component sees the SAME snapshot since this
    //      field is initialized once. (Plus, this is captured into a field
    //      that's never updated.)
    this.snapshotParams = route.snapshot.queryParams as Record<string, string>;

    // BUG: paramMap subscribed in constructor BEFORE the route's
    //      ActivatedRoute is fully wired in some scenarios (lazy children,
    //      resolvers). Move to ngOnInit.
    route.paramMap.subscribe((m) => console.log('[paramMap]', m.get('id')));
  }

  ngOnInit() {
    // BUG: no takeUntilDestroyed — subscription survives the component
    //      and the counter climbs across navigations.
    this.route.queryParams.subscribe((p) => {
      this.live = p as Record<string, string>;
      this.counters.count++;
      console.log('[listing] queryParams =', p);
    });
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
