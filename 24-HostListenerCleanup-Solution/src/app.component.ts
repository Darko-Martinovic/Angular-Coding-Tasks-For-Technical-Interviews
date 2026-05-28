// =============================================================================
// SOLUTION 24 — HostListener vs Manual DOM Listener
// =============================================================================
//
// Every change is annotated `// FIX #n`. Rules:
//   - One bound function per listener: store it once, pass the same
//     reference to add/remove.
//   - For element-on-host listeners, prefer @HostListener (auto-removed
//     by Angular when the component is destroyed).
//   - For document/window listeners, manually pair add/remove in
//     ngOnInit / ngOnDestroy.
// =============================================================================

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-listener',
  standalone: true,
  template: `<p>listener instance — click anywhere, hit a key</p>`,
})
export class ListenerComponent implements OnInit, OnDestroy {
  // FIX #1: arrow-function fields are bound to `this` once at construction
  //         AND give us a stable reference to remove. Same reference goes
  //         to add and remove.
  private onClick = (e: MouseEvent) => {
    console.log('[click] target =', (e.target as HTMLElement).tagName);
  };
  private onKey = (e: KeyboardEvent) => {
    console.log('[keydown] key =', e.key);
  };

  ngOnInit() {
    window.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKey);
  }

  ngOnDestroy() {
    // FIX #2: remove the SAME function reference we registered. Because
    //         the field is an arrow function created once, this works.
    window.removeEventListener('click', this.onClick);
    // FIX #3: actually remove the keydown listener too.
    document.removeEventListener('keydown', this.onKey);
  }

  // For element-local listeners, the equivalent in Angular is @HostListener,
  // which Angular registers AND removes for you automatically. (Not used
  // for window/document because Angular's @HostListener('window:click')
  // works too, but to keep the demo about manual addEventListener vs the
  // .bind(this) trap, we use the manual API explicitly.)
  @HostListener('mouseenter')
  onHover() { /* auto-removed by Angular */ }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListenerComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>Listener Cleanup</h1>
      <button (click)="visible = !visible">Toggle</button>
      @if (visible) { <app-listener /> }
    </main>
  `,
})
export class AppComponent {
  visible = true;
}
