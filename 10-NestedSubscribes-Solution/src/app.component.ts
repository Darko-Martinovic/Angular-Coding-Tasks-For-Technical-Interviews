// =============================================================================
// SOLUTION 10 — Nested Subscribes Instead of switchMap
// =============================================================================
//
// Every change is annotated `// FIX #n`. switchMap is the right operator
// here: when a new outer id arrives, the previous inner load is unsubscribed
// (cancelled), and only the newest detail reaches the subscriber. One
// subscribe, tied to the component lifetime with takeUntilDestroyed.
// =============================================================================

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Detail { id: number; payload: string; }

function loadDetail(id: number): Observable<Detail> {
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
    </section>
  `,
})
export class DetailComponent implements OnInit {
  current: Detail | null = null;
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // FIX #1: switchMap — each new selection cancels the previous inner
    //         load. No nested subscribe, no race, no leak of in-flight
    //         requests.
    // FIX #2: replace `current` rather than push into a history array;
    //         the displayed detail always matches the latest selection.
    // FIX #3: takeUntilDestroyed ties this subscription to the component
    //         lifetime; toggling the component off cancels both the
    //         outer subscribe AND the in-flight inner load.
    selectedId$
      .pipe(
        switchMap((id) => loadDetail(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((d) => (this.current = d));
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
