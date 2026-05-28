// =============================================================================
// TASK 11 — switchMap vs mergeMap vs concatMap
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// Three Rx pipes, three different flattening operators, ALL of them
// chosen wrong:
//   - autocomplete uses `mergeMap` — slow responses for OLD queries arrive
//     after the latest one and overwrite the visible list.
//   - "save" button uses `switchMap` — clicking save twice quickly cancels
//     the first save in-flight; the server never sees that write.
//   - paged loader uses `mergeMap` — the page-3 response can land before
//     page-2's, scrambling the order.
//
// GOAL: Pick the right operator for each call site. Rule of thumb:
//   - switchMap   "I only care about the latest" (typeahead, route param)
//   - concatMap   "Order matters, run sequentially"            (writes, paging)
//   - mergeMap    "Run in parallel, order doesn't matter"      (independent jobs)
//   - exhaustMap  "Ignore new triggers while one is in-flight" (login submit)
//
// THINGS TO SCRUTINISE:
//   1. The query for "a" takes 600ms; the query for "abc" takes 100ms.
//      With mergeMap, the "a" result lands AFTER "abc" and overwrites
//      the visible suggestions to the stale one.
//   2. saveDraft() resolves slowly. If a user clicks Save twice quickly,
//      switchMap cancels the first request — that write is lost.
//   3. Pages 1..3 are emitted in order; their responses each take a
//      different time. mergeMap allows them to land in any order.
//
// EXPECTED CORRECT BEHAVIOR:
//   - autocomplete shows the suggestions for the LATEST query, even when
//     older ones resolve slower.
//   - every Save click results in a "[saveDraft] persisted" log; none are
//     cancelled.
//   - pages render 1, 2, 3 in that order.
//
// ACTUAL (buggy) BEHAVIOR: console shows "[suggest] resolve query=a" AFTER
//   "abc" and the list flips back; some saves are cancelled; pages arrive
//   shuffled.
// =============================================================================

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, from } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';

function suggest(q: string): Observable<string[]> {
  return new Observable((s) => {
    const delay = Math.max(50, 700 - q.length * 200);
    const t = setTimeout(() => {
      console.log(`[suggest] resolve query='${q}' after ${delay}ms`);
      s.next([`${q}-1`, `${q}-2`, `${q}-3`]);
      s.complete();
    }, delay);
    return () => clearTimeout(t);
  });
}

function saveDraft(d: string): Observable<string> {
  return new Observable((s) => {
    const t = setTimeout(() => { console.log(`[saveDraft] persisted '${d}'`); s.next(d); s.complete(); }, 400);
    return () => { clearTimeout(t); console.log(`[saveDraft] cancelled '${d}'`); };
  });
}

function loadPage(p: number): Observable<{ page: number; rows: string[] }> {
  return new Observable((s) => {
    const delay = p === 1 ? 300 : p === 2 ? 50 : 150; // 1 slow, 2 fast, 3 medium
    const t = setTimeout(() => { console.log(`[loadPage] page=${p} resolve`); s.next({ page: p, rows: [`r${p}.1`, `r${p}.2`] }); s.complete(); }, delay);
    return () => clearTimeout(t);
  });
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>switchMap / mergeMap / concatMap</h1>
      <input #q (input)="query$.next(q.value)" placeholder="type fast: a, ab, abc" />
      <ul>@for (s of suggestions; track s) { <li>{{ s }}</li> }</ul>
      <button (click)="saveClicks$.next('draft-' + (++saveSeq))">Save</button>
      <button (click)="loadPages()">Load pages 1..3</button>
      <ol>@for (p of pages; track p.page) { <li>page {{ p.page }}: {{ p.rows.join(', ') }}</li> }</ol>
    </main>
  `,
})
export class AppComponent implements OnInit {
  query$ = new Subject<string>();
  saveClicks$ = new Subject<string>();
  suggestions: string[] = [];
  pages: { page: number; rows: string[] }[] = [];
  saveSeq = 0;
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // BUG: mergeMap on autocomplete — old slow responses overwrite new
    //      fast responses. Should be switchMap (only care about latest).
    this.query$
      .pipe(mergeMap((q) => suggest(q)), takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => (this.suggestions = s));

    // BUG: switchMap on save — every new Save click cancels the previous
    //      save in-flight. Writes are lost. Should be concatMap (order
    //      matters and we must NOT drop) or exhaustMap.
    this.saveClicks$
      .pipe(switchMap((d) => saveDraft(d)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  loadPages() {
    this.pages = [];
    // BUG: mergeMap shuffles by response time. Should be concatMap so
    //      pages arrive in 1, 2, 3 order.
    from([1, 2, 3])
      .pipe(mergeMap((p) => loadPage(p)), takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => this.pages.push(p));
  }
}
