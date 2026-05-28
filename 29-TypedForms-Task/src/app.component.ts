// =============================================================================
// TASK 29 — Strictly Typed Reactive Forms  (type-check task)
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: type-check (fails `tsc --noEmit` by design)
//
// CHECKLIST — find and fix each:
//   [ ] A `FormGroup<{ name: FormControl<string> }>` is built with
//       `new FormControl('')` whose default type is `FormControl<string |
//       null>`. Type mismatch.
//   [ ] `FormBuilder.group({ name: '' })` (not the NonNullable builder)
//       gives controls typed `string | null`. The downstream
//       `value.name.toUpperCase()` is illegal on null.
//   [ ] `FormArray<FormControl<number>>.push(new FormControl('oops'))`
//       — pushing a string control into a number-typed FormArray.
//
// EXPECTED: `npm run typecheck` shows the three errors; with the fixes
//   the file compiles cleanly.
// =============================================================================

import { Component } from '@angular/core';
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
  // BUG: `new FormControl('')` defaults to FormControl<string | null>,
  //      not FormControl<string>. tsc rejects the assignment.
  form: FormGroup<{ name: FormControl<string> }> = new FormGroup<{ name: FormControl<string> }>({
    name: new FormControl(''),
  });

  // BUG: the regular FormBuilder gives nullable controls; the call to
  //      .toUpperCase() on a potentially null string is illegal.
  private fb = new FormBuilder();
  loose = this.fb.group({ name: '' });
  upper: string = this.loose.value.name.toUpperCase();

  // BUG: pushing a FormControl<string> into a FormArray<FormControl<number>>
  //      is a type error.
  numbers: FormArray<FormControl<number>> = new FormArray<FormControl<number>>([]);
  constructor() {
    this.numbers.push(new FormControl('oops'));
  }
}
