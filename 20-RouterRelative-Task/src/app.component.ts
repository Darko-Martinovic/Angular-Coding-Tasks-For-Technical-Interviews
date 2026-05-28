// =============================================================================
// TASK 20 — Router.navigate Relative vs Absolute
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page; watch the URL after each click)
//
// Two nested routes: `/users` and `/users/:id` (rendered inside <users>).
// In `<users>`, three buttons all want to navigate to the SAME child:
//   - "go relative"   → router.navigate(['1'])
//   - "go from slash" → router.navigate(['/1'])
//   - "keep query"    → router.navigate(['/users/2'], { queryParams: {tab:1} })
// All three navigate wrong, in different ways.
//
// GOAL: Fix each navigation so it lands at `/#/users/:id`, preserving the
//       existing query string where intended.
//
// THINGS TO SCRUTINISE:
//   1. `router.navigate(['1'])` from inside `<users>` resolves at the
//      ROUTER root, not relative to the current route — Angular's
//      navigate is absolute by default. Add `{ relativeTo: this.route }`.
//   2. `router.navigate(['/1'])` is absolute and equivalent to going to
//      `/1` — which does not exist; it falls back to the wildcard.
//   3. `queryParamsHandling` defaults to "" (replace), so passing
//      queryParams without `'merge'` wipes the existing `?from=…` query.
//
// EXPECTED CORRECT BEHAVIOR:
//   - "go relative" navigates to /#/users/1, keeping the existing query.
//   - "go from slash" also navigates to /#/users/1.
//   - "keep query" navigates to /#/users/2 and PRESERVES ?from=…&tab=1.
//
// ACTUAL (buggy) BEHAVIOR: first lands at /1 (not /users/1); second
//   same; third clobbers the existing ?from=….
// =============================================================================

import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, Routes } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `<h3>user detail (id={{ id }})</h3>`,
})
export class UserDetailComponent {
  id = window.location.hash.split('/').pop();
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <h2>users</h2>
      <p>
        <a [routerLink]="['/users', 9]" [queryParams]="{from: 'sidebar'}">seed /users/9?from=sidebar</a>
      </p>
      <button (click)="goRelative()">go relative</button>
      <button (click)="goFromSlash()">go from slash</button>
      <button (click)="keepQuery()">keep query</button>
      <router-outlet />
    </section>
  `,
})
export class UsersComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}

  goRelative() {
    // BUG: no `relativeTo` — `navigate(['1'])` resolves at the router root
    //      → goes to /1, not /users/1.
    this.router.navigate(['1']);
  }

  goFromSlash() {
    // BUG: leading slash makes it absolute → /1, not /users/1.
    this.router.navigate(['/1']);
  }

  keepQuery() {
    // BUG: queryParamsHandling defaults to "" (replace) — passing { tab: 1 }
    //      wipes the existing ?from=sidebar.
    this.router.navigate(['/users', 2], { queryParams: { tab: 1 } });
  }
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'users',
    component: UsersComponent,
    children: [{ path: ':id', component: UserDetailComponent }],
  },
  { path: '**', component: UsersComponent }, // for the buggy nav fallout
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Router relative vs absolute</h1>
      <p>URL: <code>{{ url() }}</code></p>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  url = () => window.location.hash;
}
