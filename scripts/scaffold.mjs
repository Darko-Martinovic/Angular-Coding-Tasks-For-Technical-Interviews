// Generates the per-app boilerplate (package.json, index.html, vite.config.ts,
// tsconfig.json, src/main.ts) for every Task/Solution folder from the manifest.
// It is idempotent and NEVER overwrites an existing src/app.component.ts (the
// real content). Run from the repo root:  node scripts/scaffold.mjs
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS, folderName } from './manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pkgJson = (folder) => JSON.stringify({
  name: folder.toLowerCase(),
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview',
    typecheck: 'tsc --noEmit -p tsconfig.app.json',
  },
}, null, 2) + '\n';

const indexHtml = (title) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <app-root>Loading…</app-root>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

const viteConfig = `// Re-exports the repo-root shared config so all 60 apps share ONE config + ONE dependency set.
export { default } from '../vite.config.shared';
`;

const tsAppConfig = JSON.stringify({
  extends: '../tsconfig.base.json',
  compilerOptions: {
    outDir: './dist/out-tsc',
  },
  files: ['src/main.ts'],
  include: ['src/**/*.ts'],
}, null, 2) + '\n';

// Editor-friendly root tsconfig per app — just references the app config so
// VS Code / WebStorm pick up the Angular settings without a separate dance.
const tsRootConfig = JSON.stringify({
  files: [],
  references: [{ path: './tsconfig.app.json' }],
}, null, 2) + '\n';

const mainTs = `import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
`;

const placeholderApp = (title) => `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<h1>${title} — app.component.ts not authored yet</h1>\`,
})
export class AppComponent {}
`;

let made = 0;
for (const t of TASKS) {
  for (const kind of ['Task', 'Solution']) {
    const folder = folderName(t, kind);
    const dir = join(root, folder);
    const src = join(dir, 'src');
    mkdirSync(src, { recursive: true });

    const title = `${t.num} ${t.title} — ${kind}`;
    writeFileSync(join(dir, 'package.json'), pkgJson(folder));
    writeFileSync(join(dir, 'index.html'), indexHtml(title));
    writeFileSync(join(dir, 'vite.config.ts'), viteConfig);
    writeFileSync(join(dir, 'tsconfig.json'), tsRootConfig);
    writeFileSync(join(dir, 'tsconfig.app.json'), tsAppConfig);

    // src/main.ts and src/app.component.ts are PRESERVED if they already
    // exist — a few topics (router / http) need an authored main.ts that
    // wires providers via bootstrapApplication's second argument.
    const mainPath = join(src, 'main.ts');
    if (!existsSync(mainPath)) writeFileSync(mainPath, mainTs);

    const appPath = join(src, 'app.component.ts');
    if (!existsSync(appPath)) writeFileSync(appPath, placeholderApp(title));
    made++;
  }
}
console.log(`Scaffolded ${made} app folders (app.component.ts preserved where present).`);
