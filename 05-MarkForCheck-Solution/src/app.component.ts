// =============================================================================
// SOLUTION 05 — detectChanges vs markForCheck
// =============================================================================
//
// Every change is annotated `// FIX #n`. Picking the right CD tool:
//   - outside zone + immediate visibility needed → detectChanges() (inside a
//     zone.run, OR markForCheck inside zone.run — either schedules a tick)
//   - inside zone, a property changed → markForCheck() is enough
//   - subscription that may outlive the component → takeUntilDestroyed
// =============================================================================

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

const trigger$ = new Subject<number>();

@Component({
  selector: 'app-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <p>tick: <strong>{{ tick }}</strong></p>
      <p>last emit: <strong>{{ last }}</strong></p>
    </section>
  `,
})
export class ChildComponent implements OnInit, OnDestroy {
  tick = 0;
  last = 0;
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private intervalHandle?: ReturnType<typeof setInterval>;

  constructor() {
    // FIX #1: bind the trigger subscription's lifetime to this view so that
    //         emits after destroy can't reach a destroyed view, and use
    //         markForCheck() (we are inside Angular's zone here — a normal
    //         CD pass will be scheduled).
    trigger$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((n) => {
        this.last = n;
        this.cdr.markForCheck();
      });
  }

  ngOnInit() {
    // FIX #2: removed the eager detectChanges() — initial bindings have not
    //         finished settling yet, and Angular will check this view as
    //         part of the normal first CD pass anyway.

    this.zone.runOutsideAngular(() => {
      this.intervalHandle = setInterval(() => {
        this.tick++;
        // FIX #3: outside the zone, no CD pass is scheduled automatically.
        //         Re-enter the zone to schedule one, then markForCheck does
        //         the right thing for an OnPush view.
        this.zone.run(() => this.cdr.markForCheck());
      }, 1000);
    });
  }

  ngOnDestroy() {
    if (this.intervalHandle !== undefined) clearInterval(this.intervalHandle);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChildComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>detectChanges vs markForCheck</h1>
      <button (click)="visible = !visible">Toggle</button>
      <button (click)="trigger()">Trigger emit</button>
      @if (visible) { <app-child /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
  private next = 1;
  trigger() { trigger$.next(this.next++); }
}
