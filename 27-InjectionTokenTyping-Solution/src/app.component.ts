// =============================================================================
// SOLUTION 27 — InjectionToken Typing
// =============================================================================
//
// Every change is annotated `// FIX #n`.
//   - `new InjectionToken<Config>('CFG')` so consumers know the type.
//   - `useFactory: (): Config => ({...})` annotated; TS now insists on a
//     complete Config object.
//   - The provider returns ALL Config fields (including the method).
// =============================================================================

import { Component, InjectionToken, inject } from '@angular/core';

export interface Config {
  apiBase: string;
  flags: string[];
  formatBase(): string;
}

// FIX #1: typed token. inject(CFG) returns Config.
export const CFG = new InjectionToken<Config>('CFG');

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [
    {
      provide: CFG,
      // FIX #2 & #3: typed factory return AND complete Config shape.
      useFactory: (): Config => ({
        apiBase: '/api',
        flags: ['a', 'b'],
        formatBase() { return `<<${this.apiBase}>>`; },
      }),
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
  private cfg = inject(CFG); // typed Config
  apiBase = this.cfg.apiBase;
  flags = this.cfg.flags;
  formatted = this.cfg.formatBase();
}
