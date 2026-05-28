// =============================================================================
// SOLUTION 11 — switchMap vs mergeMap vs concatMap
// =============================================================================
//
// Every change is annotated `// FIX #n`. The right operator per use case:
//   - typeahead (only-latest):  switchMap
//   - writes (preserve order):  concatMap
//   - paged loader (in order):  concatMap
// =============================================================================

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, from } from 'rxjs';
import { concatMap, switchMap } from 'rxjs/operators';

function suggest(q: string): Observable<string[]> {
  return new Observable((s) => {
    const delay = Math.max(50, 700 - q.length * 200);
    const t = setTimeout(() => { console.log(`[suggest] resolve query='${q}' after ${delay}ms`); s.next([`${q}-1`, `${q}-2`, `${q}-3`]); s.complete(); }, delay);
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
    const delay = p === 1 ? 300 : p === 2 ? 50 : 150;
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
    // FIX #1: switchMap for autocomplete — older in-flight queries are
    //         cancelled when a new keystroke arrives. The latest wins
    //         regardless of network speed.
    this.query$
      .pipe(switchMap((q) => suggest(q)), takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => (this.suggestions = s));

    // FIX #2: concatMap for save — each save is queued behind the previous
    //         one. No write is cancelled. (Alternative: exhaustMap to
    //         ignore rapid double-clicks while one save is pending.)
    this.saveClicks$
      .pipe(concatMap((d) => saveDraft(d)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  loadPages() {
    this.pages = [];
    // FIX #3: concatMap for paging — each page waits for the previous
    //         page's request to complete, so they arrive in source order.
    from([1, 2, 3])
      .pipe(concatMap((p) => loadPage(p)), takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => this.pages.push(p));
  }
}
