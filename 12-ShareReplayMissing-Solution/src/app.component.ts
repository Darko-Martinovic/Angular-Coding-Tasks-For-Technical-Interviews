// =============================================================================
// SOLUTION 12 — Missing shareReplay on a Service
// =============================================================================
//
// Every change is annotated `// FIX #n`. shareReplay({ bufferSize: 1,
// refCount: false }) makes the source fire once, multicasts to current
// subscribers, AND replays the latest value to late subscribers without
// dropping the replay when the last subscriber unsubscribes. Pair it with
// a ReplaySubject(1) for the ping stream so late subscribers get the last
// value too.
// =============================================================================

import { Component, Injectable, OnInit } from '@angular/core';
import { Observable, ReplaySubject, of, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';

interface Config { apiBase: string; flags: string[]; }

@Injectable({ providedIn: 'root' })
export class ConfigService {
  // FIX #1: build the multicasted observable ONCE in the field initializer
  //         and reuse it from every consumer.
  // FIX #2: refCount: false means "even when consumers come and go, keep
  //         the cached emission". A toggle-off / toggle-on of the body
  //         does not re-fetch.
  private config$: Observable<Config> = of<Config>({ apiBase: '/api', flags: ['a', 'b'] }).pipe(
    tap(() => console.log('[fetchConfig] HTTP')),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  get(): Observable<Config> {
    return this.config$;
  }

  // FIX #3: ReplaySubject(1) instead of Subject. Late subscribers get the
  //         last value emitted, not nothing.
  pingTimes$ = new ReplaySubject<number>(1);
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
    // Both calls now go through the same multicast subject — one HTTP
    // total, regardless of how many consumers add themselves later.
    this.cfg.get().subscribe((c) => (this.flags = c.flags));
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
    setTimeout(() => this.cfg.ping(), 50);
  }
  ping() { this.cfg.ping(); }
}
