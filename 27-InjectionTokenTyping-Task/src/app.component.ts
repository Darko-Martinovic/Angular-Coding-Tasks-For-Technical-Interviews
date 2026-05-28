// =============================================================================
// TASK 27 — InjectionToken Typing  (type-check task)
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: type-check (fails `tsc --noEmit` by design)
//
// `tsc --noEmit -p tsconfig.app.json` reports MULTIPLE errors. The bugs
// are all about losing the static type of a configuration value somewhere
// between declaration, provider, and consumer.
//
// CHECKLIST — find and fix each:
//   [ ] `new InjectionToken('CFG')` has no `<Config>` generic — consumers
//       inject() with no type info; `cfg.apiBase` is reading from
//       `unknown`, which tsc reports as
//       "Property 'apiBase' does not exist on type 'unknown'".
//   [ ] The provider's useFactory returns an object MISSING `flags` and
//       `formatBase`; once the token is typed Config, this provider
//       assignment fails type-checking.
//   [ ] `useFactory: () => ({ ... })` has no return annotation; the
//       inferred return type slips through provider type-checking even
//       though the shape is wrong.
//
// EXPECTED: with the fixes applied, `npm run typecheck` is clean and the
//   page renders the configured API base.
// =============================================================================

import { Component, InjectionToken, inject } from '@angular/core';

export interface Config {
  apiBase: string;
  flags: string[];
  formatBase(): string;
}

// BUG: no generic. inject(CFG) is typed `unknown`.
export const CFG = new InjectionToken('CFG');

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [
    {
      provide: CFG,
      // BUG: no return annotation; returned shape is incomplete vs Config.
      useFactory: () => ({ apiBase: '/api' }),
    },
  ],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>InjectionToken Typing</h1>
      <p>apiBase = {{ apiBase }}</p>
      <p>flags = {{ flags.join(',') }}</p>
      <p>formatted = {{ formatted }}</p>
    </main>
  `,
})
export class AppComponent {
  // BUG: cfg is `unknown` because CFG isn't typed. Every property
  //      access below is a tsc error.
  private cfg = inject(CFG);
  apiBase: string = this.cfg.apiBase;
  flags: string[] = this.cfg.flags;
  formatted: string = this.cfg.formatBase();
}
