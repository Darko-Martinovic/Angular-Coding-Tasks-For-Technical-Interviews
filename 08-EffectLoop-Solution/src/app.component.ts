// =============================================================================
// SOLUTION 08 — effect() That Writes a Read Signal
// =============================================================================
//
// Every change is annotated `// FIX #n`. Effect rules of thumb:
//   - To compute a value FROM other signals, use computed(), not effect().
//   - To write inside an effect, wrap reads of signals you're going to
//     write in untracked(...) so the write doesn't re-trigger this effect.
//   - effect() can only be created in an injection context — constructor,
//     field initializer, or `runInInjectionContext(injector, ...)`.
// =============================================================================

import { Component, effect, signal, untracked } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Effects: count = {{ count() }}, value = {{ value() }}, enabled = {{ enabled() }}</h1>
      <button (click)="count.set(count() + 1)">Bump count</button>
      <button (click)="value.set(value() + 1)">Bump value</button>
      <button (click)="enabled.set(!enabled())">Toggle enabled</button>
    </main>
  `,
})
export class AppComponent {
  count = signal(0);
  value = signal(0);
  enabled = signal(false);

  constructor() {
    // FIX #1: this effect's job is "log + track count". It MUST NOT write
    //         to count. If we genuinely needed to "tick" count along, we'd
    //         drive that from a setInterval or an event — not from inside
    //         an effect that reads count itself.
    effect(() => {
      console.log('[effect count] =', this.count());
    });

    // FIX #2: read both signals every run so both are tracked as
    //         dependencies. The if-guard goes around the side effect, not
    //         around the read.
    effect(() => {
      const en = this.enabled();
      const v = this.value();
      if (en) console.log('[effect value] =', v);
    });

    // FIX #3: effect() at the field/constructor level — this IS an
    //         injection context. (Equivalent: a field initializer like
    //         `private logEffect = effect(() => ...)`.)
    effect(() => console.log('[effect onInit] enabled =', this.enabled()));
  }
  // ngOnInit removed — there was nothing legal for it to do here.
}
