// =============================================================================
// SOLUTION 18 — FormArray Mutated By Index
// =============================================================================
//
// Every change is annotated `// FIX #n`. Use the FormArray API:
//   - push(control)
//   - removeAt(index)
//   - setControl(index, control)
// and track @for by a stable identity (the control reference itself).
// =============================================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>FormArray by Index</h1>
      <button (click)="add()">Add</button>
      <ul>
        <!-- FIX #3: track by the control reference itself — stable across
                     reorders and removals, so DOM nodes stay paired with
                     the right controls. -->
        @for (c of controls; track c; let i = $index) {
          <li>
            <input [formControl]="c" />
            <button (click)="remove(i)">Remove</button>
            <button (click)="reset(i)">Reset</button>
          </li>
        }
      </ul>
      <pre>fa.value = {{ fa.value | json }}</pre>
    </main>
  `,
})
export class AppComponent {
  fa = new FormArray<FormControl<string | null>>([new FormControl('a')]);

  get controls() { return this.fa.controls; }

  add() {
    // FIX #1: FormArray.push registers the control and emits valueChanges.
    this.fa.push(new FormControl(''));
  }

  remove(i: number) {
    // FIX #2: removeAt(i) deregisters the control and emits. Internal
    //         bookkeeping (length, value, status) stays consistent.
    this.fa.removeAt(i);
  }

  reset(i: number) {
    // FIX (related): setControl(i, ...) swaps a control via the API so the
    //         FormArray re-binds parents and emits valueChanges.
    this.fa.setControl(i, new FormControl(''));
  }
}
