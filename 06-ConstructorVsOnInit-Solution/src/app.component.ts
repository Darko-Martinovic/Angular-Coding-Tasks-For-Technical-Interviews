// =============================================================================
// SOLUTION 06 — Work in constructor vs ngOnInit
// =============================================================================
//
// Every change is annotated `// FIX #n`. Lifecycle partitioning is:
//   - constructor:     wire up DI, create local fields. No @Input access,
//                      no ViewChild access, no side effects that depend on
//                      Angular state.
//   - ngOnInit:        @Input values are set; safe to do input-dependent
//                      initialization (fetches, default-based state).
//   - ngAfterViewInit: ViewChild / ViewChildren are populated; safe to
//                      read/use them.
//   - ngOnDestroy:     mirror every interval/listener/manual sub started
//                      anywhere else in the component.
// =============================================================================

import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

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
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() userId!: number;
  @ViewChild('title') titleRef!: ElementRef<HTMLElement>;
  name = '';
  intervalHandle?: ReturnType<typeof setInterval>;

  // FIX #1: ngOnInit, not constructor. @Inputs are guaranteed set here, so
  //         `this.userId` is 42 (the bound value), not undefined.
  ngOnInit() {
    loadUser(this.userId).then((u) => (this.name = u.name));

    // FIX #3 (move-in): start the interval here too — owning the lifecycle
    //         alongside the cleanup keeps them paired.
    this.intervalHandle = setInterval(() => console.log('[interval] tick'), 1000);
  }

  // FIX #2: ngAfterViewInit, not constructor. ViewChild bindings populate
  //         only after the view has been created and CD has wired them.
  ngAfterViewInit() {
    console.log('[viewchild] title text =', this.titleRef.nativeElement.textContent);
  }

  // FIX #3: cleanup of the interval started in ngOnInit. Symmetric pairing
  //         with the setInterval — Angular calls ngOnDestroy when the
  //         parent's @if toggles us off.
  ngOnDestroy() {
    if (this.intervalHandle !== undefined) clearInterval(this.intervalHandle);
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
