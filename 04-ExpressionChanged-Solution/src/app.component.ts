// =============================================================================
// SOLUTION 04 — ExpressionChangedAfterItHasBeenCheckedError
// =============================================================================
//
// Every change is annotated `// FIX #n`. The cure is to defer the parent-
// bound write past the current change-detection cycle (queueMicrotask /
// setTimeout / a signal that Angular schedules separately) and to drop the
// non-deterministic expression from the template.
// =============================================================================

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, NgZone, inject } from '@angular/core';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div style="height:60px;border:1px dashed #aaa;">chart with {{ size }} points</div>`,
})
export class ChartComponent implements AfterViewInit, OnInit {
  @Input() size = 0;
  @Output() pointsLoaded = new EventEmitter<number>();
  private zone = inject(NgZone);

  ngOnInit() {
    // FIX #1: deferred emit so the parent has a chance to settle this
    //         tick first. queueMicrotask schedules the emit for after the
    //         current CD cycle finishes.
    queueMicrotask(() => this.pointsLoaded.emit(0));
  }

  ngAfterViewInit() {
    // FIX #2: also deferred. Microtask is enough for a same-tick emit; if
    //         we needed a real DOM measurement we'd use queueMicrotask
    //         after requestAnimationFrame, both still inside NgZone so
    //         CD runs.
    queueMicrotask(() => this.pointsLoaded.emit(this.size * 10));
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartComponent],
  // FIX #3: removed the random() interpolation — the template must be a
  //         pure function of its bound state, not produce a different value
  //         on every check.
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>points loaded: {{ loaded }}</h1>
      <button (click)="size = size + 1">+ point</button>
      <app-chart [size]="size" (pointsLoaded)="onLoaded($event)" />
    </main>
  `,
})
export class AppComponent {
  size = 3;
  loaded = 0;

  onLoaded(n: number) {
    // No timing trick required here — the child now emits asynchronously
    // (microtask), so this runs in a fresh CD cycle and dev-mode is happy.
    this.loaded = n;
  }
}
