// =============================================================================
// SOLUTION 25 — Pure Pipe Not Recalculating
// =============================================================================
//
// Every change is annotated `// FIX #n`.
//   - For pure pipes, hand the pipe a NEW reference whenever the source
//     changes (spread, new Date, etc.).
//   - When a pipe legitimately has internal/non-deterministic state, mark
//     it `{ pure: false }` so it re-runs every CD pass — pay attention
//     to the performance cost in larger apps.
// =============================================================================

import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sum', standalone: true })
export class SumPipe implements PipeTransform {
  transform(xs: number[]): number {
    console.log('[sum] transform');
    return xs.reduce((a, b) => a + b, 0);
  }
}

@Pipe({ name: 'when', standalone: true })
export class WhenPipe implements PipeTransform {
  transform(d: Date): string {
    console.log('[when] transform');
    return d.toISOString().slice(11, 19);
  }
}

// FIX #3: marked impure so every CD pass re-invokes transform; the random
//         result is allowed to change every render.
@Pipe({ name: 'shuffle', standalone: true, pure: false })
export class ShufflePipe implements PipeTransform {
  transform(xs: string[]): string[] {
    return [...xs].sort(() => Math.random() - 0.5);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SumPipe, WhenPipe, ShufflePipe],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Pure Pipe Identity</h1>
      <p>sum = {{ nums | sum }}</p>
      <p>time = {{ when | when }}</p>
      <p>shuffled = {{ words | shuffle }}</p>
      <button (click)="add()">Add</button>
      <button (click)="tick()">Tick (+5s)</button>
      <button (click)="shuffle()">Shuffle</button>
    </main>
  `,
})
export class AppComponent {
  nums = [1, 2, 3];
  when = new Date(2026, 0, 1, 12, 0, 0);
  words = ['alpha', 'beta', 'gamma'];

  add() {
    // FIX #1: NEW array so the pure pipe sees a different identity.
    this.nums = [...this.nums, this.nums.length + 1];
  }
  tick() {
    // FIX #2: NEW Date; the pure pipe re-runs.
    this.when = new Date(this.when.getTime() + 5000);
  }
  shuffle() {
    // Now that ShufflePipe is impure, the visible order will change on
    // any CD pass (e.g. on a click). For an explicit re-shuffle, also
    // produce a new array reference:
    this.words = [...this.words];
  }
}
