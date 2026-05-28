// =============================================================================
// TASK 06 — Work in constructor vs ngOnInit
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// `<app-profile [userId]="...">` fetches the user and shows the name. The
// parent renders it with `[userId]="42"`. It logs:
//   `[loadUser] called with id = undefined`
//   `[interval] still tick…  tick…  tick…` (forever, after Toggle off)
// Three timing mistakes are at fault.
//
// GOAL: Fix the constructor / ngOnInit / ngOnDestroy partitioning so
//       lifecycle work happens in the lifecycle phase Angular guarantees.
//
// THINGS TO SCRUTINISE:
//   1. When does Angular set @Input bindings on a component? Before
//      constructor or after? Where in the lifecycle is the first guaranteed
//      access?
//   2. `@ViewChild('title') titleRef!: ElementRef<HTMLElement>`. When is
//      `titleRef.nativeElement` actually populated?
//   3. There is an `intervalHandle` set in the constructor. Where is the
//      symmetric cleanup that would stop it on destroy?
//
// EXPECTED CORRECT BEHAVIOR:
//   - Log: `[loadUser] called with id = 42` (exactly once per Toggle on).
//   - The `<h2 #title>` text is logged with its real DOM content, not "".
//   - After Toggle off, the interval STOPS — no more `[interval] tick`.
//
// ACTUAL (buggy) BEHAVIOR: fetch is called with `undefined`; titleRef is
//   null when first read; the interval keeps ticking after destroy.
// =============================================================================

import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

function loadUser(id: number | undefined) {
  console.log('[loadUser] called with id =', id);
  return Promise.resolve({ id, name: id ? `User#${id}` : '(none)' });
}

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <section style="border:1px solid #888;padding:8px;">
      <h2 #title>{{ name }}</h2>
      <small>(id={{ userId }})</small>
    </section>
  `,
})
export class ProfileComponent implements OnInit, OnDestroy {
  @Input() userId!: number;
  @ViewChild('title') titleRef!: ElementRef<HTMLElement>;
  name = '';
  intervalHandle?: ReturnType<typeof setInterval>;

  constructor() {
    // BUG: at construction time, @Input values have not been set yet —
    //      `this.userId` is undefined, so the network call is wrong.
    loadUser(this.userId).then((u) => (this.name = u.name));

    // BUG: ViewChild references are populated after view init. In the
    //      constructor, `titleRef` is undefined.
    console.log('[viewchild] title text =', this.titleRef?.nativeElement?.textContent ?? '(null)');

    // BUG: starting an interval here is fine, but the cleanup belongs in
    //      ngOnDestroy. We have no ngOnDestroy at all, so the interval
    //      leaks forever after the component is destroyed.
    this.intervalHandle = setInterval(() => console.log('[interval] tick'), 1000);
  }

  ngOnInit() {
    // (intentionally empty — should be doing the @Input-dependent work here)
  }

  ngOnDestroy() {
    // (intentionally missing — should clear the interval here)
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfileComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Constructor vs ngOnInit</h1>
      <button (click)="visible = !visible">Toggle</button>
      @if (visible) { <app-profile [userId]="42" /> }
    </main>
  `,
})
export class AppComponent { visible = true; }
