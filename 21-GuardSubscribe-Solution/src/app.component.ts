// =============================================================================
// SOLUTION 21 — Route Guard Returns Before Subscribe Resolves
// =============================================================================
//
// Every change is annotated `// FIX #n`. Guard contract: RETURN the
// async result (Observable, Promise, or value). Don't subscribe inside —
// the router subscribes for you and uses the emitted value.
// =============================================================================

import { Component, Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, RouterLink, RouterOutlet, Routes } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

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
    // FIX #3 (related): the service rejects on failure so the guard can
    //         catch and route to false. Resolved promise from observable
    //         to keep the example uniform.
    return Promise.reject(new Error('auth-failed'));
  }
}

// FIX #1: RETURN the observable. The router subscribes once, awaits the
//         emission, and uses it as the guard result.
export const eagerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.check().pipe(take(1));
};

// FIX #2: just map the observable — no inner subscribe. take(1) so the
//         observable completes after the first emission.
export const subInObsGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.check().pipe(take(1), map((ok) => ok));
};

// FIX #3: catch the promise rejection and resolve to false (or redirect
//         to /login). The router gets a definite answer.
export const neverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.checkOrThrow().catch(() => {
    router.navigate(['/']);
    return false;
  });
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
