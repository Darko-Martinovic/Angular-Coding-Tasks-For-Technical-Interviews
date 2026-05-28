// Runs `npm run build` in every Task and Solution folder. Used as a smoke test
// that every app at least compiles. Note: Vite (under analog) does NOT enforce
// `tsc --noEmit` rules at build time — it strips types and AOT-compiles the
// templates. So even the four type-check `-Task` apps (27/28/29/30) build
// cleanly; the type errors only surface from `npm run typecheck`. This script
// therefore expects ALL 60 apps to build.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS, folderName } from './manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

// Every app is expected to build cleanly. (For tsc-level failures see
// typecheck-all.mjs.)
const expectedFailures = new Set();

let passed = 0;
let failedUnexpectedly = 0;
let failedExpectedly = 0;
const unexpected = [];

for (const t of TASKS) {
  for (const kind of ['Task', 'Solution']) {
    const folder = folderName(t, kind);
    const r = spawnSync(npm, ['run', 'build', '-w', folder, '--silent'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      shell: true, // npm.cmd on Windows needs this to launch via the shell.
    });
    const ok = r.status === 0;
    const shouldFail = expectedFailures.has(folder);
    if (ok && !shouldFail) {
      passed++;
      console.log(`✔  ${folder}`);
    } else if (!ok && shouldFail) {
      failedExpectedly++;
      console.log(`✔  ${folder} (expected build failure — type-check task)`);
    } else if (!ok && !shouldFail) {
      failedUnexpectedly++;
      unexpected.push(folder);
      console.log(`✘  ${folder}  UNEXPECTED FAILURE`);
      process.stderr.write(r.stderr || r.stdout || '');
    } else {
      // ok && shouldFail
      failedUnexpectedly++;
      unexpected.push(folder);
      console.log(`✘  ${folder}  EXPECTED to fail (type-check task) but PASSED`);
    }
  }
}

console.log(`\n${passed} passed, ${failedExpectedly} failed as expected, ${failedUnexpectedly} unexpected.`);
if (unexpected.length) {
  console.log('Unexpected:', unexpected.join(', '));
  process.exit(1);
}
