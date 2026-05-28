// =============================================================================
// TASK 24 — HostListener vs Manual DOM Listener
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console; click Toggle several times)
//
// `<app-listener>` attaches click handlers manually via
// `addEventListener` and never removes them. Every time you Toggle the
// component on/off, more handlers stack up. A second handler is
// "removed" but a fresh `.bind(this)` wrapper passed to
// `removeEventListener` doesn't match the one originally registered.
//
// GOAL: Pick the right tool per case:
//   - For element-local listeners on the host: use `@HostListener` (auto
//     teardown) or `(click)` in the template.
//   - For window/document listeners: register in ngOnInit, KEEP the
//     function reference, and remove the SAME reference in ngOnDestroy.
//   - Don't call `.bind(this)` twice — store the bound function once.
//
// THINGS TO SCRUTINISE:
//   1. `window.addEventListener('click', this.onClick)` — `this.onClick`
//      is a class method; passing it raw doesn't bind `this`. AND it is
//      never removed.
//   2. The "removal" line is `removeEventListener('click',
//      this.onClick.bind(this))` — a fresh, different function each call.
//      removeEventListener silently does nothing.
//   3. A document-level keydown handler is added per instance and never
//      tracked or removed; the per-key log count climbs by 1 per
//      Toggle-on.
//
// EXPECTED CORRECT BEHAVIOR:
//   - Toggle creates exactly ONE click handler and ONE keydown handler.
//   - Toggle off removes both.
//   - Clicks/keydowns log ONCE per event, regardless of toggle count.
//
// ACTUAL (buggy) BEHAVIOR: per-event log count climbs with every Toggle on.
// =============================================================================

import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-listener',
  standalone: true,
  template: `<p>listener instance — click anywhere, hit a key</p>`,
})
export class ListenerComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // BUG: handler never removed; .bind(this) returns a new function each
    //      call so removeEventListener below can't possibly match.
    window.addEventListener('click', this.onClick);

    // BUG: per-instance document listener with no cleanup record.
    document.addEventListener('keydown', this.onKey.bind(this));
  }

  ngOnDestroy() {
    // BUG: .bind(this) returns a NEW function. This call removes nothing.
    window.removeEventListener('click', this.onClick.bind(this));
    // (we never even attempt to remove the keydown listener)
  }

  onClick(this: ListenerComponent | Window, e: MouseEvent) {
    console.log('[click] target =', (e.target as HTMLElement).tagName);
  }
  onKey(e: KeyboardEvent) {
    console.log('[keydown] key =', e.key);
  }
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
