// =============================================================================
// TASK 12 — Missing shareReplay on a Service
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// `ConfigService.get()` returns a (fake) HTTP observable that's expensive.
// A `<app-header>` and an `<app-body>` both consume it. On first paint the
// console logs `[fetchConfig] HTTP` THREE times (header + body + body's
// useEffect-equivalent). Refreshing the page logs three again.
//
// GOAL: Make `get()` fire EXACTLY once per page load, no matter how many
//       components consume it, and have late subscribers replay the
//       latest value without re-fetching.
//
// THINGS TO SCRUTINISE:
//   1. `get()` returns the cold http observable verbatim. Every
//      subscriber re-runs the producer.
//   2. The fix is `shareReplay(...)`. But there's a subtler trap: with
//      `refCount: true`, when the last subscriber unsubscribes, the
//      replay is dropped — the NEXT subscriber re-fetches. For a config
//      that should outlive components, you want `refCount: false`
//      (the default).
//   3. There's also a separate `pingTimes$` Subject we expose without
//      bufferSize:1 — late subscribers see nothing.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Exactly ONE `[fetchConfig] HTTP` per page load.
//   - Toggling the body off and on does NOT re-fetch.
//   - A late subscriber to pingTimes$ gets the last value.
//
// ACTUAL (buggy) BEHAVIOR: three HTTP logs on initial load; toggling
//   triggers re-fetch; late subscribers to pingTimes$ get nothing.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { Observable, ReplaySubject, Subject, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface Config { apiBase: string; flags: string[]; }

@Injectable({ providedIn: 'root' })
export class ConfigService {
  // BUG: cold observable returned directly. Each consumer re-runs the
  //      `tap` and triggers the simulated HTTP.
  get(): Observable<Config> {
    return of<Config>({ apiBase: '/api', flags: ['a', 'b'] }).pipe(
      tap(() => console.log('[fetchConfig] HTTP')),
    );
  }

  // BUG: a plain Subject — late subscribers get NO replay.
  pingTimes$ = new Subject<number>();
  ping() { this.pingTimes$.next(Date.now()); }
}

@Component({
  selector: 'app-header',
  standalone: true,
  template: `<header>API base = {{ apiBase }}</header>`,
})
export class HeaderComponent implements OnInit {
  apiBase = '';
  constructor(private cfg: ConfigService) {}
  ngOnInit() { this.cfg.get().subscribe((c) => (this.apiBase = c.apiBase)); }
}

@Component({
  selector: 'app-body',
  standalone: true,
  template: `<p>flags = {{ flags.join(',') }} | last ping = {{ lastPing }}</p>`,
})
export class BodyComponent implements OnInit {
  flags: string[] = [];
  lastPing = '(none)';
  constructor(private cfg: ConfigService) {}
  ngOnInit() {
    // BUG: second consumer → second HTTP.
    this.cfg.get().subscribe((c) => (this.flags = c.flags));
    // BUG: an additional, "footer summary" consumer → THIRD HTTP. Real
    //      apps tend to grow this number without anyone noticing.
    this.cfg.get().subscribe((c) => console.log('[footer] flags', c.flags));

    this.cfg.pingTimes$.subscribe((t) => (this.lastPing = new Date(t).toLocaleTimeString()));
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, BodyComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>ShareReplay Missing</h1>
      <button (click)="visible = !visible">Toggle body</button>
      <button (click)="ping()">Ping</button>
      <app-header />
      @if (visible) { <app-body /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
  constructor(private cfg: ConfigService) {
    // Fire a ping BEFORE any subscriber exists — with a plain Subject this
    // is lost; with a ReplaySubject(1) the body's late subscriber gets it.
    setTimeout(() => this.cfg.ping(), 50);
  }
  ping() { this.cfg.ping(); }
}
