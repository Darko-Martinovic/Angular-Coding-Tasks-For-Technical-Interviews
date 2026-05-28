// =============================================================================
// SOLUTION 19 — valueChanges Writes Back to Form
// =============================================================================
//
// Every change is annotated `// FIX #n`. Cures:
//   - `patchValue({...}, { emitEvent: false })` when patching from inside
//     a valueChanges handler.
//   - Validators are PURE — they return error objects, they don't write.
//     Derived fields belong in a valueChanges subscription with emitEvent
//     guarded, or in a computed signal, or in a parent template binding.
//   - The seeded child uses `distinctUntilChanged` so re-emitting the
//     same value is a no-op.
// =============================================================================

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-seeded',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" placeholder="seeded" />`,
})
export class SeededComponent {
  ctrl = new FormBuilder().control('');
  // FIX #3: only write to the control if the incoming seed differs from
  //         the current value AND only after construction. setValue with
  //         `emitEvent: false` would also break the loop; equality guard
  //         is the simplest fix.
  @Input() set seed(v: string) {
    if (v !== undefined && v !== this.ctrl.value) {
      this.ctrl.setValue(v, { emitEvent: false });
    }
  }
}

// FIX #2: validator is now PURE. It returns null (no errors). We do NOT
//         derive fields from validators.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SeededComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>valueChanges Loop</h1>
      <form [formGroup]="form">
        <input formControlName="first" placeholder="first" />
        <input formControlName="last" placeholder="last" />
        <input formControlName="full" placeholder="full" readonly />
        <input formControlName="summary" placeholder="summary" readonly />
      </form>
      <app-seeded [seed]="form.value.full ?? ''" />
      <pre>{{ form.value | json }}</pre>
    </main>
  `,
})
export class AppComponent {
  form: FormGroup = new FormBuilder().group({
    first: [''], last: [''], full: [''], summary: [''],
  });

  constructor() {
    this.form.valueChanges.subscribe((v) => {
      // FIX #1: emitEvent:false on the derived patches so this handler is
      //         NOT re-entered. The user-typed events still propagate;
      //         only OUR programmatic writes are silenced.
      this.form.patchValue(
        {
          full: `${v.first ?? ''} ${v.last ?? ''}`.trim(),
          summary: `${v.first ?? ''}/${v.last ?? ''}`,
        },
        { emitEvent: false },
      );
    });
  }
}
