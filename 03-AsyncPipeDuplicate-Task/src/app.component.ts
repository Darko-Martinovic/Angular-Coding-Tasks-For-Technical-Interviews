// =============================================================================
// TASK 03 — async Pipe Used Multiple Times
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the Network panel and the console)
//
// `users$` is a cold HTTP-like observable (we use a fake "fetch" that logs
// each call). The template binds it through `| async` in THREE places
// (header count, list, footer summary), and there's also a sibling
// `<app-meta>` that subscribes to the same `users$` it receives via @Input.
//
// GOAL: Fix it so the data is loaded exactly ONCE per page render, no
//       matter how many places consume it.
//
// THINGS TO SCRUTINISE:
//   1. `async` is itself a *subscriber*. How many subscribers does each
//      `| async` create? What does a COLD observable do when subscribed to
//      multiple times? (Hint: it re-runs its producer for each one.)
//   2. The sibling `<app-meta>` calls `.subscribe(...)` on the same observable
//      passed as an input — that's a fourth subscriber.
//   3. There's a "Refresh" button that should re-fetch — but it currently
//      doesn't, because the observable's value was captured into a local
//      array on first load and re-read from there.
//
// EXPECTED CORRECT BEHAVIOR:
//   - "[fetchUsers] HTTP" is logged ONCE per page render. Reloading the page
//     logs it once again. Clicking Refresh logs it once more.
//   - All three template bindings AND the meta sibling show the same data
//     and were served from the same network call.
//
// ACTUAL (buggy) BEHAVIOR: four "[fetchUsers] HTTP" log lines on first paint
//   (3 from the template's async pipes, 1 from the meta child), and the
//   Refresh button does nothing visible.
// =============================================================================

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

interface User { id: number; name: string; }

// Pretend this is an HTTP request. Each subscriber re-runs it.
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

  ngOnInit() {
    // BUG #2 (related): a fourth, independent subscription to the SAME cold
    //      observable. Fires another HTTP request.
    this.users$.subscribe((u) => (this.count = u.length));
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
        <!-- BUG #1: each | async is a separate subscriber → separate HTTP. -->
        @for (u of users$ | async; track u.id) { <li>{{ u.id }} — {{ u.name }}</li> }
      </ul>
      <footer>total: {{ (users$ | async)?.length ?? 0 }}</footer>
      <app-meta [users$]="users$" />
      <p><button (click)="refresh()">Refresh</button></p>
    </main>
  `,
})
export class AppComponent {
  // BUG #1 (root): cold observable; no shareReplay, no multicast. Each
  //      consumer triggers a fresh fetch.
  users$ = fetchUsers();

  refresh() {
    // BUG #3: assigning the SAME observable instance to the same field is a
    //      no-op for the template — async pipe sees ===, doesn't re-subscribe.
    this.users$ = this.users$;
  }
}
