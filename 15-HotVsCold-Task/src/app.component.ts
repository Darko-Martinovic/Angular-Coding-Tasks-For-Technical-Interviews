// =============================================================================
// TASK 15 — Hot vs Cold Observable Confusion
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// Three "shared service" mistakes that all boil down to: COLD producers
// were treated as if they were already multicast.
//
// GOAL: Convert each cold source into a properly multicast hot one with
//       initial/latest value semantics that match each consumer's needs.
//
// THINGS TO SCRUTINISE:
//   1. `clock$` is `interval(1000)` returned directly. Each subscriber
//      gets its OWN timer starting from its OWN subscribe time — so two
//      components see different counts and "[interval] start" logs twice.
//   2. `currentUser$` is exposed via `.asObservable()` from a Subject, but
//      the service `.next()`s the user BEFORE any consumer subscribes
//      (during construction). A plain Subject drops it on the floor.
//   3. `pulse$` IS multicast via `share()`, but `share()` defaults are
//      effectively refCount: true with no replay — a SECOND subscriber
//      that arrives between ticks waits for the next emission and never
//      sees the value the first subscriber just received.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Two clock subscribers tick together with the same numbers; only
//     ONE `[interval] start` log.
//   - The greeter (added after auto-login) immediately shows "Ada".
//   - The second pulse subscriber gets the previous value immediately.
//
// ACTUAL (buggy) BEHAVIOR: clocks drift; greeter is empty; second pulse
//   subscriber waits up to a second before its first value arrives.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { Observable, Subject, interval, share } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User { name: string; }

@Injectable({ providedIn: 'root' })
export class TimeService {
  // BUG: cold — each subscriber resets and gets its own counter.
  clock$: Observable<number> = interval(1000).pipe(tap((n) => n === 0 && console.log('[interval] start')));

  // BUG: `next()` runs in the constructor; consumers subscribing later via
  //      `.asObservable()` get nothing — plain Subject has no buffer.
  private userSubject = new Subject<User>();
  currentUser$ = this.userSubject.asObservable();

  // BUG: `share()` multicasts the upstream but does not replay the last
  //      emission. A late subscriber waits for the NEXT pulse.
  pulse$ = interval(800).pipe(share());

  constructor() {
    this.userSubject.next({ name: 'Ada' });
  }
}

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<p>clock [{{ id }}] = {{ tick }}</p>`,
})
export class ClockComponent implements OnInit {
  id = '';
  tick = -1;
  constructor(private ts: TimeService) {}
  ngOnInit() {
    this.id = Math.random().toString(36).slice(2, 6);
    this.ts.clock$.subscribe((n) => (this.tick = n));
  }
}

@Component({
  selector: 'app-greeter',
  standalone: true,
  template: `<p>hello, {{ name }}</p>`,
})
export class GreeterComponent implements OnInit {
  name = '(none)';
  constructor(private ts: TimeService) {}
  ngOnInit() { this.ts.currentUser$.subscribe((u) => (this.name = u.name)); }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ClockComponent, GreeterComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Hot vs Cold</h1>
      <app-greeter />
      <app-clock />
      <app-clock />
      <p>pulses received: A={{ a }} | B={{ b }}</p>
      <button (click)="addB()">Subscribe pulse B (later)</button>
    </main>
  `,
})
export class AppComponent implements OnInit {
  a = '(none)';
  b = '(none)';
  constructor(private ts: TimeService) {}
  ngOnInit() { this.ts.pulse$.subscribe((n) => (this.a = String(n))); }
  addB() { this.ts.pulse$.subscribe((n) => (this.b = String(n))); }
}
