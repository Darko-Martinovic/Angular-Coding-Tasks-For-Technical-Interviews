// =============================================================================
// TASK 25 — Pure Pipe Not Recalculating
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page)
//
// A `SumPipe` (pure) totals an array of numbers. A `WhenPipe` (pure)
// formats a Date. Three things go wrong:
//   - The parent pushes into the same array; the pipe never re-fires.
//   - The parent mutates the same Date object; the date pipe never updates.
//   - A pipe that genuinely needs to be impure (a "shuffle" pipe) is
//     declared pure and its output sticks.
//
// GOAL: Make every visible pipe output reflect the latest data. Two of the
//       three cures are "produce a NEW reference"; one is "declare the
//       pipe impure (`{ pure: false }`)".
//
// THINGS TO SCRUTINISE:
//   1. Pure pipes only re-run when input identity changes. `arr.push(x)`
//      yields the same array reference.
//   2. `date.setSeconds(...)` mutates in place; the input identity is
//      unchanged.
//   3. A pipe that has internal state (random sort) needs to be marked
//      `{ pure: false }` to be invoked on every CD pass, OR be made into
//      a function that gets a stable seed.
//
// EXPECTED CORRECT BEHAVIOR:
//   - "Add" appends a number and the sum updates.
//   - "Tick" advances the displayed date by 5 seconds.
//   - "Shuffle" re-shuffles the visible order.
//
// ACTUAL (buggy) BEHAVIOR: sum, date, and shuffle output all stick.
// =============================================================================

import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sum', standalone: true /* default: pure */ })
export class SumPipe implements PipeTransform {
  transform(xs: number[]): number {
    console.log('[sum] transform');
    return xs.reduce((a, b) => a + b, 0);
  }
}

@Pipe({ name: 'when', standalone: true /* default: pure */ })
export class WhenPipe implements PipeTransform {
  transform(d: Date): string {
    console.log('[when] transform');
    return d.toISOString().slice(11, 19);
  }
}

@Pipe({ name: 'shuffle', standalone: true /* BUG: should be { pure: false } */ })
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
    // BUG: push mutates in place; pipe sees the same reference.
    this.nums.push(this.nums.length + 1);
  }
  tick() {
    // BUG: setSeconds mutates the Date; same reference.
    this.when.setSeconds(this.when.getSeconds() + 5);
  }
  shuffle() {
    // (Doesn't matter what we do here — the pipe is pure with the same
    //  reference, so the output sticks.)
    // …but the bug is in the @Pipe declaration above.
    void this.words;
  }
}
