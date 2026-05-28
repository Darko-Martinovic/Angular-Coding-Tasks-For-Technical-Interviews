// =============================================================================
// TASK 30 — Generic Component Constraints  (type-check task)
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: type-check (fails `tsc --noEmit` by design)
//
// CHECKLIST — find and fix each:
//   [ ] `class ListComponent<T>` uses `item.id` in `trackById` — but
//       there is no `T extends { id: string }` constraint. tsc errors on
//       the `.id` access.
//   [ ] `function find<T>(xs: T[], predicate: ...)` uses `x.id` inside
//       its body — also no constraint, also a tsc error.
//   [ ] A pipe-style method `pluckName<T>(x: T): string { return x.name; }`
//       — `x.name` is illegal without a `T extends { name: string }`
//       constraint.
//
// EXPECTED: `npm run typecheck` reports the errors; after fixing the
//   constraints it is clean.
// =============================================================================

import { Component, Input } from '@angular/core';

// BUG: needs `T extends { id: string }`. Without it, `item.id` is illegal.
@Component({
  selector: 'app-list',
  standalone: true,
  template: `<ul>@for (it of items; track trackById(it)) { <li>{{ it.id }}</li> }</ul>`,
})
export class ListComponent<T> {
  @Input() items: T[] = [];
  trackById(item: T): string {
    return item.id;
  }
}

// BUG: no constraint; `x.id` is a tsc error.
function find<T>(xs: T[], predicate: (x: T) => boolean): T | undefined {
  return xs.find((x) => predicate(x) && x.id !== undefined);
}

// BUG: no constraint; `x.name` is a tsc error.
function pluckName<T>(x: T): string {
  return x.name;
}

interface Person { id: string; name: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <app-list [items]="people" />
      <p>first = {{ firstName }}</p>
      <p>plucked = {{ plucked }}</p>
    </main>
  `,
})
export class AppComponent {
  people: Person[] = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Linus' }];
  firstName = find(this.people, (p) => p.id === 'a')?.name ?? '';
  plucked = pluckName(this.people[0]);
}
