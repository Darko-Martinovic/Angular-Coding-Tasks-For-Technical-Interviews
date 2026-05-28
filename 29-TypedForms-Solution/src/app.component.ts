// =============================================================================
// SOLUTION 29 — Strictly Typed Reactive Forms
// =============================================================================
//
// Every change is annotated `// FIX #n`.
//   - Pass `{ nonNullable: true }` to FormControl, or use
//     `NonNullableFormBuilder` (via `fb.nonNullable.group(...)`).
//   - The `<T>` on FormControl/FormGroup/FormArray is the value type; make
//     sure every value pushed/initialized matches.
// =============================================================================

import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Strictly Typed Forms</h1>
      <p>name = {{ form.value.name }}</p>
      <p>upper = {{ upper }}</p>
      <p>numbers length = {{ numbers.length }}</p>
    </main>
  `,
})
export class AppComponent {
  // FIX #1: nonNullable:true makes the control's value type `string`
  //         (defaults to '' on reset), not `string | null`.
  form: FormGroup<{ name: FormControl<string> }> = new FormGroup<{ name: FormControl<string> }>({
    name: new FormControl('', { nonNullable: true }),
  });

  // FIX #2: use fb.nonNullable so .value.name is `string`.
  private fb = inject(FormBuilder);
  loose = this.fb.nonNullable.group({ name: '' });
  upper: string = this.loose.value.name!.toUpperCase();

  // FIX #3: push a number-valued FormControl (nonNullable so the value
  //         type is `number`, not `number | null`).
  numbers: FormArray<FormControl<number>> = new FormArray<FormControl<number>>([]);
  constructor() {
    this.numbers.push(new FormControl(0, { nonNullable: true }));
  }
}
