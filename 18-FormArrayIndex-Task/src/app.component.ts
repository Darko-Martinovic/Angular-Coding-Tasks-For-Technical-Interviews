// =============================================================================
// TASK 18 — FormArray Mutated By Index
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the page)
//
// A `FormArray` of `FormControl<string>`s drives a list of inputs. There's
// Add / Remove(i) / Reset(i). After a few clicks, the rendered inputs and
// the FormArray's internal state are out of sync: inputs bind to wrong
// rows, removed rows reappear, and "Reset" wipes the wrong index.
//
// GOAL: Use FormArray's API exclusively (push, removeAt, setControl) and
//       track @for by a stable identity so DOM nodes pair with the right
//       controls across reorders.
//
// THINGS TO SCRUTINISE:
//   1. `this.fa.controls[i] = new FormControl(...)` — assigning to the
//      `controls` array by index bypasses FormArray's internal bookkeeping.
//      `.value` reads the controls array AT ITS CURRENT LENGTH but no
//      change event is emitted; valueChanges, status, etc. all drift.
//   2. `this.fa.controls.splice(i, 1)` — same problem. `removeAt(i)` does
//      the right thing.
//   3. `@for (c of controls; track $index)` — when removing index 0,
//      every later row re-binds to the WRONG control because trackBy is
//      the index. Track by the control identity instead.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Add → input row appears, fa.value gains a "" entry.
//   - Type "X" in row 1, type "Y" in row 2; Remove(1) leaves "Y" still
//     visible AND in fa.value.
//   - Reset(2) clears row 2's input without touching row 1.
//
// ACTUAL (buggy) BEHAVIOR: removed rows re-render with previous values,
//   reset hits the wrong row, fa.value diverges from what you see.
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
        <!-- BUG: tracking by $index — after a removal the DOM rows
                   re-bind to the wrong controls. -->
        @for (c of controls; track $index; let i = $index) {
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
    // BUG: pushing through the bare array bypasses FormArray's signals.
    this.fa.controls.push(new FormControl(''));
  }

  remove(i: number) {
    // BUG: splice on the controls array does not notify the FormArray.
    //      Use removeAt(i) instead.
    this.fa.controls.splice(i, 1);
  }

  reset(i: number) {
    // BUG: replacing a control by index, again bypassing FormArray's
    //      internal tracking; the parent group never re-emits.
    this.fa.controls[i] = new FormControl('');
  }
}
