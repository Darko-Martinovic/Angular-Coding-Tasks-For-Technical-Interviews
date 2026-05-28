// =============================================================================
// SOLUTION 17 — Reactive Form Accessed Too Early
// =============================================================================
//
// Every change is annotated `// FIX #n`. Build the form in a FIELD
// INITIALIZER (or the constructor) so it exists before any template binding
// or child @Input setter runs. Subscribe to `valueChanges` AFTER the group
// exists. Read `@Input` values in `ngOnInit`, not the constructor.
// =============================================================================

import { Component, Input, OnInit, inject } from '@angular/core';
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
export class NameFieldComponent implements OnInit {
  @Input() form!: FormGroup;

  // FIX #2: move the @Input-dependent read into ngOnInit. By then Angular
  //         has set the input and `this.form` is the parent's FormGroup.
  ngOnInit() {
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
      <form [formGroup]="form">
        <input formControlName="name" placeholder="name in parent" />
      </form>
      <app-name-field [form]="form" />
      <pre>value = {{ form.value | json }}</pre>
    </main>
  `,
})
export class AppComponent {
  // FIX #1: build the form in a field initializer. It exists before the
  //         first CD pass runs, so [formGroup] and formControlName both
  //         see a real value.
  private fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({ name: [''] });

  constructor() {
    // FIX #3: subscribe AFTER the group exists (it does, via the field
    //         initializer above). Constructor or ngOnInit both work now.
    this.form.valueChanges.subscribe((v) => console.log('[valueChanges]', v));
  }
}
