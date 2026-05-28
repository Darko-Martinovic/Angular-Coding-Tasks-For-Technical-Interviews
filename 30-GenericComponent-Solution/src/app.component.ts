// =============================================================================
// SOLUTION 30 — Generic Component Constraints
// =============================================================================
//
// Every change is annotated `// FIX #n`. The cure for "T has no field x"
// is to constrain T at the declaration site:  `<T extends { id: string }>`.
// =============================================================================

import { Component, Directive, Input } from '@angular/core';

interface HasId { id: string; }

// FIX #1: constrain T to types that have an `id`.
@Component({
  selector: 'app-list',
  standalone: true,
  template: `<ul>@for (it of items; track it.id) { <li>{{ it.id }}</li> }</ul>`,
})
export class ListComponent<T extends HasId> {
  @Input() items: T[] = [];
}

// FIX #2: constrain T at the function signature; `x.id` now type-checks.
function find<T extends HasId>(xs: T[], predicate: (x: T) => boolean): T | undefined {
  return xs.find((x) => predicate(x) && x.id !== undefined);
}

// FIX #3: explicit `ngTemplateContextGuard` / generics for directives is
//         the full Angular pattern; for inputs, parameterizing T with a
//         default keeps the inference happy in templates.
@Directive({ standalone: true, selector: '[appHi]' })
export class HiDirective<T = unknown> {
  @Input('appHi') value!: T;
}

interface Person { id: string; name: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListComponent, HiDirective],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <app-list [items]="people" />
      <p [appHi]="firstName">{{ firstName.toUpperCase() }}</p>
    </main>
  `,
})
export class AppComponent {
  people: Person[] = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Linus' }];
  firstName = find(this.people, (p) => p.id === 'a')?.name ?? '';
}
