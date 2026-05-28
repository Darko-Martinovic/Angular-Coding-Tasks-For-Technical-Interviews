// Runs `tsc --noEmit` in every Task and Solution folder. The four type-check
// task topics (27/28/29/30) have their -Task apps EXPECTED to fail tsc; all
// other apps (every Solution + every behavioral -Task) are expected to pass.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS, folderName } from './manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const expectedFailures = new Set(
  TASKS.filter((t) => t.type === 'type-check').map((t) => folderName(t, 'Task')),
);

let passed = 0;
let failedExpectedly = 0;
let unexpected = [];

for (const t of TASKS) {
  for (const kind of ['Task', 'Solution']) {
    const folder = folderName(t, kind);
    const r = spawnSync(npm, ['run', 'typecheck', '-w', folder, '--silent'], {
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
      console.log(`✔  ${folder} (expected tsc failure)`);
    } else if (!ok && !shouldFail) {
      unexpected.push(folder);
      console.log(`✘  ${folder}  UNEXPECTED tsc failure`);
      process.stderr.write(r.stdout || r.stderr || '');
    } else {
      unexpected.push(folder);
      console.log(`✘  ${folder}  EXPECTED to fail tsc but PASSED`);
    }
  }
}

console.log(`\n${passed} passed, ${failedExpectedly} failed as expected, ${unexpected.length} unexpected.`);
if (unexpected.length) {
  console.log('Unexpected:', unexpected.join(', '));
  process.exit(1);
}
