// =============================================================================
// TASK 19 — valueChanges Writes Back to Form
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console — the tab may hang)
//
// A reactive form with `first` and `last`. A `valueChanges` subscriber
// recomputes `full = first + ' ' + last` and patches it back into the form.
// A cross-field validator also patches a "summary" field inside its own
// check. Both produce infinite-loop emissions: the patch fires
// valueChanges, which fires the patch, …
//
// GOAL: Stop the feedback loops without losing the derived value.
//   - Use `emitEvent: false` when patching INSIDE a valueChanges handler.
//   - Validators must be PURE — they return errors, they don't mutate.
//
// THINGS TO SCRUTINISE:
//   1. `valueChanges.subscribe(v => form.patchValue({ full: v.first + ' ' + v.last }))`
//      — patchValue emits valueChanges by default. Each emission triggers
//      another patch.
//   2. The custom validator calls `form.get('summary')?.setValue(...)`.
//      Validators run during status updates which run after value updates;
//      the setValue inside re-runs the validator forever.
//   3. The child has `@Input() set seed(v: string) { this.form.setValue({ value: v }); }`
//      which itself emits valueChanges that triggers the parent's
//      patchValue, which sets the seed back into the child.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Type "Ada" in first: `full` updates to "Ada " (with a trailing space
//     if last is empty), without the console exploding.
//   - The summary updates without re-running the validator.
//
// ACTUAL (buggy) BEHAVIOR: thousands of "[valueChanges]" logs per
//   keystroke; the page may hang.
// =============================================================================

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-seeded',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" placeholder="seeded" />`,
})
export class SeededComponent {
  // BUG: setter writes to form on every set → triggers parent's
  //      valueChanges → parent patches us → setter fires again.
  ctrl = new FormBuilder().control('');
  @Input() set seed(v: string) {
    if (v !== undefined) this.ctrl.setValue(v);
  }
}

// BUG: validator MUTATES the form. Validators run during status updates;
//      this setValue cascades back into validator runs forever.
const summaryValidator: ValidatorFn = (g: AbstractControl) => {
  const grp = g as FormGroup;
  const v = grp.value as { first: string; last: string };
  grp.get('summary')?.setValue(`${v.first}/${v.last}`);
  return null;
};

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
  form = new FormBuilder().group(
    { first: [''], last: [''], full: [''], summary: [''] },
    { validators: [summaryValidator] },
  );

  constructor() {
    // BUG: patchValue without emitEvent:false → triggers a fresh
    //      valueChanges, which re-runs this handler, which patches, …
    this.form.valueChanges.subscribe((v) => {
      console.log('[valueChanges]');
      this.form.patchValue({ full: `${v.first} ${v.last}`.trim() });
    });
  }
}
