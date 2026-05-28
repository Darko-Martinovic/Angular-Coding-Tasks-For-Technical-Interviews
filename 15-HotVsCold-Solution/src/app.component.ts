// =============================================================================
// SOLUTION 15 — Hot vs Cold Observable Confusion
// =============================================================================
//
// Every change is annotated `// FIX #n`. The fixes:
//   - shareReplay({ bufferSize: 1, refCount: false }) makes a cold source
//     hot AND replays the latest value to late subscribers.
//   - ReplaySubject(1) instead of Subject so the "current user" can be
//     pushed before subscribers attach.
//   - For `share()` to replay, pass `{ connector: () => new
//     ReplaySubject(1) }` — or just use shareReplay.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { Observable, ReplaySubject, interval, share, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User { name: string; }

@Injectable({ providedIn: 'root' })
export class TimeService {
  // FIX #1: shareReplay so all consumers share ONE interval and late
  //         subscribers see the most recent tick immediately.
  clock$: Observable<number> = interval(1000).pipe(
    tap((n) => n === 0 && console.log('[interval] start')),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  // FIX #2: ReplaySubject(1) so the value next()'d in the constructor is
  //         delivered to subscribers that attach later.
  private userSubject = new ReplaySubject<User>(1);
  currentUser$ = this.userSubject.asObservable();

  // FIX #3: configure share() with a ReplaySubject connector so it replays
  //         the last value to late subscribers. (Equivalent: shareReplay.)
  pulse$ = interval(800).pipe(share({ connector: () => new ReplaySubject(1) }));

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
