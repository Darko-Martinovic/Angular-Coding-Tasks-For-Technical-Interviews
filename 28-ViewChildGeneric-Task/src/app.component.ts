// =============================================================================
// TASK 28 — ViewChild Generic Typing  (type-check task)
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: type-check (fails `tsc --noEmit` by design)
//
// CHECKLIST — find and fix each:
//   [ ] `@ViewChild('input') input!: ElementRef<HTMLDivElement>` — the
//       template-reference `#input` is on an `<input>` element, but the
//       field is typed `HTMLDivElement`. Reading `.value` (a property of
//       HTMLInputElement, not HTMLDivElement) fails tsc.
//   [ ] `@ViewChild(ChildComp) child!: ElementRef<ChildComp>` — by
//       default `@ViewChild(Component)` returns the COMPONENT INSTANCE,
//       not an ElementRef wrapping it. Calling `this.child.greet()`
//       fails because ElementRef has no `.greet`.
//   [ ] `@ViewChildren('rowRef') rows!: QueryList<HTMLDivElement>` — a
//       template-reference on a plain element yields an
//       `ElementRef<HTMLDivElement>`, not the raw element. Reading
//       `rows.first.nativeElement` fails because HTMLDivElement has no
//       `nativeElement`.
//
// EXPECTED: `npm run typecheck` reports the type errors; after applying
//   the fixes it is clean.
// =============================================================================

import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';

@Component({ selector: 'app-child', standalone: true, template: `<p>child</p>` })
export class ChildComponent { greet() { return 'hi'; } }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChildComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <input #input />
      <p>value = {{ value }}</p>
      <app-child></app-child>
      <p>greeting = {{ greeting }}</p>
      <div #rowRef>row</div>
      <p>row tag = {{ rowTag }}</p>
    </main>
  `,
})
export class AppComponent {
  // BUG: typed as HTMLDivElement but the #input ref is on an <input>.
  @ViewChild('input') input!: ElementRef<HTMLDivElement>;
  // BUG: HTMLDivElement has no `.value` — tsc error.
  value: string = this.input?.nativeElement.value;

  // BUG: @ViewChild(Component) returns the component instance, NOT an
  //      ElementRef wrapping it. Calling .greet() on ElementRef fails.
  @ViewChild(ChildComponent) child!: ElementRef<ChildComponent>;
  greeting: string = this.child?.greet();

  // BUG: QueryList<HTMLDivElement> can't be right — #ref yields an
  //      ElementRef wrapper, so `.first.nativeElement` is illegal on
  //      HTMLDivElement.
  @ViewChildren('rowRef') rows!: QueryList<HTMLDivElement>;
  rowTag: string = this.rows?.first?.nativeElement.tagName ?? '';
}
