// =============================================================================
// SOLUTION 03 — async Pipe Used Multiple Times
// =============================================================================
//
// Every change is annotated `// FIX #n`. The fix is "subscribe once, fan out
// many" — share the observable with shareReplay and reuse it from the meta
// child. Then make Refresh actually re-issue the request.
// =============================================================================

import { Component, Input, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, shareReplay } from 'rxjs';

interface User { id: number; name: string; }

function fetchUsers(): Observable<User[]> {
  return new Observable<User[]>((subscriber) => {
    console.log('[fetchUsers] HTTP');
    const id = setTimeout(() => {
      subscriber.next([
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Linus' },
        { id: 3, name: 'Grace' },
      ]);
      subscriber.complete();
    }, 200);
    return () => clearTimeout(id);
  });
}

@Component({
  selector: 'app-meta',
  standalone: true,
  imports: [CommonModule],
  template: `<p style="color:#888;">meta: {{ count }} loaded</p>`,
})
export class MetaComponent implements OnInit {
  @Input() users$!: Observable<User[]>;
  count = 0;
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // FIX #2 (and don't leak): reuse the multicast observable; with
    //         shareReplay below, this is the same buffered emission, not a
    //         new HTTP. takeUntilDestroyed prevents the leak on unmount.
    this.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => (this.count = u.length));
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MetaComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>users (loaded {{ (users$ | async)?.length ?? 0 }}×)</h1>
      <ul>
        @for (u of users$ | async; track u.id) { <li>{{ u.id }} — {{ u.name }}</li> }
      </ul>
      <footer>total: {{ (users$ | async)?.length ?? 0 }}</footer>
      <app-meta [users$]="users$" />
      <p><button (click)="refresh()">Refresh</button></p>
    </main>
  `,
})
export class AppComponent {
  // FIX #1: wrap the cold source in shareReplay({ bufferSize: 1, refCount:
  //         true }) so all N current subscribers share ONE upstream
  //         subscription and late subscribers replay the cached last value.
  //         No more fan-out of HTTP calls.
  users$ = fetchUsers().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  refresh() {
    // FIX #3: assign a freshly-piped observable so the template's async pipe
    //         sees a NEW reference, unsubscribes the previous one, and
    //         subscribes to the new one — which re-runs fetchUsers exactly
    //         once and multicasts to the three template binds + meta child.
    this.users$ = fetchUsers().pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
