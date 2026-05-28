// =============================================================================
// TASK 16 — Template-driven ngModel Without `name`
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console, watch the form value)
//
// A small template-driven form with two `<input [(ngModel)]="...">`
// controls inside a `<form #f="ngForm">`. Submitting logs `f.value` —
// which is `{}` no matter what you type. Resetting also doesn't clear
// the inputs. A third input ALSO has `name="email"` but a different
// model — it stomps the first one.
//
// GOAL: Make `f.value` reflect every control, make Reset clear them all,
//       and give each control its OWN name so they don't collide.
//
// THINGS TO SCRUTINISE:
//   1. Template-driven forms register controls by their `name` attribute.
//      An `<input [(ngModel)]="...">` WITHOUT `name=""` never registers
//      with the parent `NgForm` — its value never appears in `f.value`,
//      and `f.reset()` cannot clear it.
//   2. `name` is required even when the component-side model field is
//      bound — Angular uses `name` as the form-value key, not the
//      property name.
//   3. Two inputs declaring `name="email"` register as the same control;
//      the second's `[(ngModel)]` value wins and the first becomes a
//      ghost that mutates the same key.
//
// EXPECTED CORRECT BEHAVIOR:
//   - After typing, console.log(f.value) shows
//     `{ first: 'Ada', last: 'Lovelace', email: 'ada@example.com' }`.
//   - Reset clears every field.
//
// ACTUAL (buggy) BEHAVIOR: `f.value` is `{}` for the unnamed control,
//   reset misses it, and the email field is shared between two `[(ngModel)]`s.
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
        <!-- BUG: no 'name' attribute, never registers with the NgForm. -->
        <input [(ngModel)]="first" placeholder="first" />
        <!-- BUG: same issue, control not in f.value. -->
        <input [(ngModel)]="last" placeholder="last" />
        <!-- BUG: collides with the second email below. -->
        <input name="email" [(ngModel)]="email1" placeholder="email1" />
        <input name="email" [(ngModel)]="email2" placeholder="email2" />
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
