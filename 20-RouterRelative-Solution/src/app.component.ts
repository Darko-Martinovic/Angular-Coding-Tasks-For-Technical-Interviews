// =============================================================================
// SOLUTION 20 — Router.navigate Relative vs Absolute
// =============================================================================
//
// Every change is annotated `// FIX #n`. Three pieces:
//   - navigate(commands, { relativeTo: this.route }) for nested-relative.
//   - drop leading slashes when you intend a relative path.
//   - queryParamsHandling: 'merge' to keep the existing query string.
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
    // FIX #1: relativeTo this.route so navigate(['1']) resolves under
    //         the current /users route → /users/1.
    this.router.navigate(['1'], { relativeTo: this.route });
  }

  goFromSlash() {
    // FIX #2: drop the leading slash; pass the full absolute path
    //         explicitly. Either ['/users', 1] or ['users', 1] +
    //         relativeTo: parent.
    this.router.navigate(['/users', 1]);
  }

  keepQuery() {
    // FIX #3: queryParamsHandling: 'merge' keeps ?from=sidebar AND adds
    //         &tab=1. 'preserve' keeps ONLY the existing params.
    this.router.navigate(['/users', 2], {
      queryParams: { tab: 1 },
      queryParamsHandling: 'merge',
    });
  }
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'users',
    component: UsersComponent,
    children: [{ path: ':id', component: UserDetailComponent }],
  },
  { path: '**', component: UsersComponent },
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
