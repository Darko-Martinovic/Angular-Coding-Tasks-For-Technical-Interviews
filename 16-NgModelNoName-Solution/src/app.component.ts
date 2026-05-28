// =============================================================================
// SOLUTION 16 — Template-driven ngModel Without `name`
// =============================================================================
//
// Every change is annotated `// FIX #n`. In template-driven forms, the
// `name=""` attribute is the form-value key. Without it, Angular won't
// register the control on the parent NgForm at all. Different controls
// must use different names.
// =============================================================================

import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Template form</h1>
      <form #f="ngForm" (ngSubmit)="onSubmit(f)">
        <!-- FIX #1: give it a 'name' so it registers as f.value.first -->
        <input name="first" [(ngModel)]="first" placeholder="first" />
        <!-- FIX #2: same — a control with name="" is the form-value key. -->
        <input name="last" [(ngModel)]="last" placeholder="last" />
        <!-- FIX #3: distinct names so they register as separate controls.
                     Two inputs with name="email" collapse into one. -->
        <input name="email1" [(ngModel)]="email1" placeholder="email1" />
        <input name="email2" [(ngModel)]="email2" placeholder="email2" />
        <p>
          <button type="submit">Submit</button>
          <button type="button" (click)="f.reset()">Reset</button>
        </p>
      </form>
      <pre>f.value = {{ f.value | json }}</pre>
      <pre>model = first='{{ first }}' last='{{ last }}' email1='{{ email1 }}' email2='{{ email2 }}'</pre>
    </main>
  `,
})
export class AppComponent {
  first = '';
  last = '';
  email1 = '';
  email2 = '';
  onSubmit(f: NgForm) { console.log('[submit] f.value =', f.value); }
}
