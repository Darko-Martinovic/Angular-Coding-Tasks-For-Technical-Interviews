// =============================================================================
// SOLUTION 13 — Subject vs BehaviorSubject
// =============================================================================
//
// Every change is annotated `// FIX #n`. Subject flavors:
//   - Subject<T>           — no buffer; late subscribers see nothing.
//   - BehaviorSubject<T>   — buffers ONE value, requires an initial value,
//                            late subscribers immediately get the current.
//   - ReplaySubject<T>(n)  — buffers up to n values, no required initial.
// Use BehaviorSubject when there's a well-defined "current state".
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface User { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  // FIX #1: BehaviorSubject with an explicit initial value (null = not
  //         logged in). Late subscribers immediately see the current state.
  currentUser$ = new BehaviorSubject<User | null>(null);
  // FIX #2: BehaviorSubject(0) — late subscribers get 0 without needing
  //         the seed `next(0)` call in the constructor.
  selectedId$ = new BehaviorSubject<number>(0);

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
    // Same subscribe code as before — works because BehaviorSubject replays
    // the current value to this late subscriber.
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
  selectedId: number = 0;
  showSecond = false;
  constructor(public auth: AuthService) {
    this.auth.login();
  }
  ngOnInit() {
    this.auth.selectedId$.subscribe((id) => (this.selectedId = id));
  }
}
