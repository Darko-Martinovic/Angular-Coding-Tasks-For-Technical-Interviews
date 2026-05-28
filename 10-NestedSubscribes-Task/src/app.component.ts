// =============================================================================
// TASK 10 — Nested Subscribes Instead of switchMap
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console — symptoms appear after rapid clicking)
//
// `selectedId$` (a Subject standing in for `route.paramMap`) drives a load
// of `loadDetail(id)`. The outer subscribe nests an inner subscribe — and
// each rapid selection leaks results that paint on top of newer ones.
//
// GOAL: Replace the nested subscribe with the correct flattening operator
//       so each new selection cancels the in-flight one and only the
//       LATEST result is shown. Make the subscriptions die with the
//       component. Stop appending into a shared array.
//
// THINGS TO SCRUTINISE:
//   1. `selectedId$.subscribe(id => loadDetail(id).subscribe(...))` —
//      both subscribes leak (you have NO handle for the inner ones), AND
//      they race because nothing cancels the older inner stream.
//   2. The handler pushes results into `this.history` instead of replacing
//      `this.current` — once you switch IDs five times, you can see the
//      stale ones flash in.
//   3. `selectedId$.subscribe(...)` has no `takeUntilDestroyed` — the
//      outer subscription survives the component's destruction.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Spam the buttons: only the LAST clicked id's detail shows; older
//     in-flight responses are cancelled (you'll see "[loadDetail] cancelled
//     N" logs).
//   - Toggle the component off — no further `[loadDetail]` work happens.
//
// ACTUAL (buggy) BEHAVIOR: rapid clicks paint stale details; toggling away
//   doesn't stop the work; history fills with results from old clicks.
// =============================================================================

import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';

interface Detail { id: number; payload: string; }

function loadDetail(id: number): Observable<Detail> {
  // Shorter id resolves slower — guarantees an out-of-order race.
  return new Observable<Detail>((sub) => {
    const delay = 600 - id * 50;
    console.log(`[loadDetail] start id=${id} (delay ${delay}ms)`);
    const t = setTimeout(() => {
      console.log(`[loadDetail] resolve id=${id}`);
      sub.next({ id, payload: `payload-${id}` });
      sub.complete();
    }, delay);
    return () => { clearTimeout(t); console.log(`[loadDetail] cancelled ${id}`); };
  });
}

const selectedId$ = new Subject<number>();

@Component({
  selector: 'app-detail',
  standalone: true,
  template: `
    <section style="border:1px solid #888;padding:8px;margin-top:8px;">
      <p>current = {{ current?.id }} ({{ current?.payload }})</p>
      <p>history length = {{ history.length }}</p>
    </section>
  `,
})
export class DetailComponent implements OnInit {
  current: Detail | null = null;
  history: Detail[] = [];

  ngOnInit() {
    // BUG: nested subscribe. No cancellation between outer emissions, and
    //      no teardown for either subscription.
    selectedId$.subscribe((id) => {
      loadDetail(id).subscribe((d) => {
        this.current = d;
        // BUG: appending to a shared array means stale loads end up here
        //      forever; the "current" is also overwritten in arrival order,
        //      not selection order, so the displayed detail is wrong.
        this.history.push(d);
      });
    });
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DetailComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Nested Subscribes</h1>
      <button (click)="pick(1)">id=1</button>
      <button (click)="pick(3)">id=3</button>
      <button (click)="pick(5)">id=5</button>
      <button (click)="pick(7)">id=7</button>
      <button (click)="visible = !visible">Toggle</button>
      @if (visible) { <app-detail /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
  pick(id: number) { selectedId$.next(id); }
}
