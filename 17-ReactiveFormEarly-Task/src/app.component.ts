// =============================================================================
// TASK 17 — Reactive Form Accessed Too Early
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console — throws on first render)
//
// A parent builds a `FormGroup` and binds it via `[formGroup]="form"`. A
// child `<app-name-field>` takes the same form as an `@Input` and tries
// to read `.controls.name` in its constructor. The form is also subscribed
// to (`valueChanges`) at construction time — before it has been built.
//
// GOAL: Build the form EARLIER (constructor / field initializer) so it is
//       available everywhere, including the template's `formControlName`,
//       the child's @Input setter, and the valueChanges subscription.
//
// THINGS TO SCRUTINISE:
//   1. `[formGroup]="form"` is evaluated during the FIRST CD pass — before
//      `ngOnInit` runs. If `form` is undefined then, you get
//      "Cannot find form control with name 'name'".
//   2. `@Input() form!: FormGroup; constructor() { console.log(form.controls.name); }`
//      — @Inputs are bound AFTER the constructor. The form is undefined
//      there.
//   3. `this.form.valueChanges.subscribe(...)` runs in `ngOnInit` BEFORE
//      `this.form = fb.group(...)` runs in `ngOnInit` — order matters.
//
// EXPECTED CORRECT BEHAVIOR:
//   - No template-runtime errors on first paint.
//   - Typing in the name input updates `f.value.name` AND logs from
//     valueChanges.
//   - The child logs the control's value at the right moment.
//
// ACTUAL (buggy) BEHAVIOR: "Cannot read properties of undefined" in
//   constructor; "Cannot find form control with name 'name'" in template;
//   valueChanges throws "of undefined".
// =============================================================================

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-name-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <input formControlName="name" placeholder="name" />
    </div>
  `,
})
export class NameFieldComponent {
  @Input() form!: FormGroup;
  constructor() {
    // BUG: @Inputs are NOT set in the constructor. `this.form` is
    //      undefined here; reading `.controls.name` throws.
    console.log('[child] initial name =', this.form.controls['name'].value);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, NameFieldComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Reactive Form Accessed Too Early</h1>
      <!-- BUG: form is undefined during first CD; this throws
                 "Cannot find form control with name 'name'". -->
      <form [formGroup]="form">
        <input formControlName="name" placeholder="name in parent" />
      </form>
      <app-name-field [form]="form" />
      <pre>value = {{ form?.value | json }}</pre>
    </main>
  `,
})
export class AppComponent implements OnInit {
  form!: FormGroup;

  ngOnInit() {
    // BUG: subscribing BEFORE the group is built — `this.form` is undefined
    //      until the next line runs.
    this.form.valueChanges.subscribe((v) => console.log('[valueChanges]', v));
    this.form = new FormBuilder().group({ name: [''] });
  }
}
