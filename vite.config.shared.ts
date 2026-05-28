// Shared Vite config used by every Task/Solution app.
// Each app's own vite.config.ts simply re-exports this, so there is ONE place
// that wires up the Angular plugin and ONE set of dependencies at the repo root.
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  // analog defaults `tsconfig` to './tsconfig.app.json' (the Angular convention);
  // each app has that file alongside a thin tsconfig.json that references it.
  plugins: [angular()],
  // `root` defaults to the cwd, i.e. the individual app folder you run from.
  server: { open: true, port: 5173 },
  // Pre-bundle the common Angular runtime; speeds up cold dev server start.
  optimizeDeps: {
    include: [
      '@angular/common',
      '@angular/core',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/router',
      'rxjs',
      'rxjs/operators',
      'zone.js',
    ],
  },
});
