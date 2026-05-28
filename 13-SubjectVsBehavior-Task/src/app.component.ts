// =============================================================================
// TASK 13 — Subject vs BehaviorSubject
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// `AuthService` exposes `currentUser$` and `selectedId$`. The page logs the
// user in on init, then mounts `<app-greeter>` which subscribes to
// `currentUser$` AFTER the login has already fired. The greeter shows
// "(none)" forever because it missed the only emission.
//
// GOAL: Pick the right Subject flavor for each stream so any subscriber
//       — early OR late — observes the right initial / latest value.
//
// THINGS TO SCRUTINISE:
//   1. `Subject<User>` has no buffered value. If a subscriber attaches
//      AFTER the only `.next()` has fired, it sees nothing until the next
//      emission. BehaviorSubject<T>(initial) or ReplaySubject<T>(1) fixes
//      this.
//   2. `selectedId$` is a Subject seeded with `next(0)` in the
//      constructor. The constructor of a singleton service runs at
//      bootstrap; subscribers in your component init see nothing.
//   3. The service calls `.next(...)` from inside its own constructor.
//      Any component subscriber is necessarily later than that.
//
// EXPECTED CORRECT BEHAVIOR:
//   - When the greeter mounts, it logs "[greeter] user = Ada".
//   - The selectedId panel displays `0` (the initial selection) without
//     having to click anything.
//   - Mounting a second greeter later also gets the latest values without
//     re-issuing a login.
//
// ACTUAL (buggy) BEHAVIOR: greeter sticks at "(none)"; selectedId panel
//   is blank until you click Select; second greeter is also blank.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

interface User { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  // BUG: a Subject has NO buffered value. Subscribers added after the
  //      single `login()` emission see nothing.
  currentUser$ = new Subject<User | null>();
  // BUG: also a Subject. The next(0) below fires once at service-construct
  //      time, before any component is even built — so no one is listening.
  selectedId$ = new Subject<number>();

  constructor() {
    this.selectedId$.next(0);
  }

  login() {
    this.currentUser$.next({ id: 1, name: 'Ada' });
  }
  select(id: number) {
    this.selectedId$.next(id);
  }
}

@Component({
  selector: 'app-greeter',
  standalone: true,
  template: `<p>hello, {{ name }}</p>`,
})
export class GreeterComponent implements OnInit {
  name = '(none)';
  constructor(private auth: AuthService) {}
  ngOnInit() {
    this.auth.currentUser$.subscribe((u) => {
      this.name = u?.name ?? '(none)';
      console.log('[greeter] user =', this.name);
    });
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GreeterComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Subject vs BehaviorSubject</h1>
      <p>selectedId = {{ selectedId }}</p>
      <button (click)="auth.select(7)">Select 7</button>
      <button (click)="showSecond = true">Mount second greeter</button>
      <app-greeter />
      @if (showSecond) { <app-greeter /> }
    </main>
  `,
})
export class AppComponent implements OnInit {
  selectedId: number | string = '(none)';
  showSecond = false;
  constructor(public auth: AuthService) {
    // Logs the user in BEFORE the greeter component is instantiated. With a
    // plain Subject the greeter misses this emission entirely.
    this.auth.login();
  }
  ngOnInit() {
    this.auth.selectedId$.subscribe((id) => (this.selectedId = id));
  }
}
