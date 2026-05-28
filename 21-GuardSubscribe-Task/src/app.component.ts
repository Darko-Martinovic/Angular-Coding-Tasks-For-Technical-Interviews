// =============================================================================
// TASK 21 — Route Guard Returns Before Subscribe Resolves
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// Three functional `CanActivateFn` guards, each returning a wrong thing:
//   - `eagerGuard` calls `auth.check().subscribe(...)` and returns `true`
//     SYNCHRONOUSLY — by the time the subscribe resolves, navigation has
//     already committed.
//   - `subInObsGuard` returns an Observable but `.subscribe()`s inside
//     the operator and never unsubscribes — leaks one subscription per
//     navigation.
//   - `neverGuard` returns a Promise that resolves to false on auth
//     failure but never resolves AT ALL when the check throws — the
//     navigation hangs.
//
// GOAL: Return the async result correctly: either an Observable, a Promise,
//       or a thenable that the router awaits. Don't .subscribe() inside.
//
// THINGS TO SCRUTINISE:
//   1. CanActivateFn return type is `MaybeAsync<GuardResult>`. Returning
//      `true` synchronously short-circuits the router; the async work
//      becomes a side-effect that lands after navigation has happened.
//   2. .subscribe() inside a guard's pipe is a leak and a confusion of
//      contracts — emit/return the value via the operator pipeline.
//   3. Promise<boolean> with no resolve on error path is a hang.
//
// EXPECTED CORRECT BEHAVIOR (with hash router):
//   - Visit `/#/eager`: guard waits for auth, then allows or blocks.
//   - Visit `/#/subobs`: no growing list of "subscribers".
//   - Visit `/#/never` and trigger an auth error: navigation either
//     resolves to false or redirects, never hangs.
//
// ACTUAL (buggy) BEHAVIOR: eager always passes; subobs subscribers count
//   climbs every visit; never just hangs.
// =============================================================================

import { Component, Injectable } from '@angular/core';
import { CanActivateFn, Router, RouterLink, RouterOutlet, Routes } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private subscriberCount = 0;
  check(): Observable<boolean> {
    this.subscriberCount++;
    console.log(`[auth.check] subscriber #${this.subscriberCount}`);
    return new Observable<boolean>((sub) => {
      const t = setTimeout(() => { sub.next(true); sub.complete(); }, 300);
      return () => clearTimeout(t);
    });
  }
  checkOrThrow(): Promise<boolean> {
    return new Promise(() => {
      // BUG: never resolves on the error path — the Promise just hangs,
      //      and the route navigation never completes.
      throw new Error('auth-failed');
    });
  }
}

// BUG: subscribes inside the guard and returns true synchronously. The
//      router has already committed by the time auth resolves.
export const eagerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  auth.check().subscribe((ok) => console.log('[eagerGuard] (too late) =', ok));
  return true;
};

import { inject } from '@angular/core';

// BUG: returns an observable that .subscribes inside its own map() — that
//      subscription leaks once per navigation.
export const subInObsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.check().pipe(map((ok) => {
    auth.check().subscribe(); // leaked secondary subscribe
    return ok;
  }));
};

// BUG: returns a Promise that never resolves on the error path.
export const neverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.checkOrThrow();
};

@Component({ selector: 'app-protected', standalone: true, template: `<p>protected page</p>` })
export class ProtectedComponent {}

@Component({ selector: 'app-home', standalone: true, imports: [RouterLink], template: `
  <p><a [routerLink]="['/eager']">eager</a> | <a [routerLink]="['/subobs']">subobs</a> | <a [routerLink]="['/never']">never</a></p>
` })
export class HomeComponent {}

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'eager', canActivate: [eagerGuard], component: ProtectedComponent },
  { path: 'subobs', canActivate: [subInObsGuard], component: ProtectedComponent },
  { path: 'never', canActivate: [neverGuard], component: ProtectedComponent },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Route Guards</h1>
      <a [routerLink]="['/']">home</a>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {}
