// Runs the API and the web app together with tagged, colour-coded logs.
//   node scripts/dev.mjs          development (both with reload)
//   node scripts/dev.mjs --prod   production start (run `npm run build` first)
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const prod = process.argv.includes('--prod');
const script = prod ? 'start' : 'dev';
const windows = process.platform === 'win32';

const apps = [
  { name: 'api', dir: 'server', color: '\x1b[35m' },
  { name: 'web', dir: 'web', color: '\x1b[36m' },
];

const children = apps.map(({ name, dir, color }) => {
  const child = spawn('npm', ['--prefix', dir, 'run', script], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !windows, // own process group, so one signal reaches npm and everything below it
    shell: windows,
  });
  const tag = `${color}${name}\x1b[0m │ `;
  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on('line', (line) => console.log(tag + line));
  }
  child.on('exit', (code) => {
    console.log(`${tag}exited (${code ?? 'signal'})`);
    stop();
  });
  return child;
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const c of children) {
    try {
      process.kill(windows ? c.pid : -c.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(0), 3000).unref(); // give mongod a moment to shut down cleanly
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
