import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../apps/sms/dist/assets');
const snapshotFile = resolve(__dirname, 'snapshot.json');

if (!existsSync(snapshotFile)) {
  console.error('No snapshot.json found. Run: node scripts/snapshot.js first.');
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(snapshotFile, 'utf-8'));

const currentFiles = readdirSync(distDir).filter(
  (f) => f.endsWith('.js') && f !== 'remoteEntry.js'
);

const current = {};
for (const file of currentFiles) {
  const filePath = resolve(distDir, file);
  const contents = readFileSync(filePath);
  const size = statSync(filePath).size;
  const md5 = createHash('md5').update(contents).digest('hex');
  current[file] = { size, md5 };
}

const allFiles = new Set([...Object.keys(snapshot), ...Object.keys(current)]);
const SEP = '─'.repeat(68);

console.log('\nCHUNK COMPARISON REPORT');
console.log(SEP);

let unchanged = 0, modified = 0, added = 0, deleted = 0;

for (const file of [...allFiles].sort()) {
  const inSnapshot = snapshot[file];
  const inCurrent = current[file];

  if (inSnapshot && inCurrent) {
    if (inSnapshot.md5 === inCurrent.md5) {
      console.log(`${file.padEnd(42)} ✅ UNCHANGED   byte-for-byte identical`);
      unchanged++;
    } else {
      console.log(`${file.padEnd(42)} ✏️  MODIFIED    was ${inSnapshot.size}b → now ${inCurrent.size}b`);
      modified++;
    }
  } else if (!inSnapshot && inCurrent) {
    console.log(`${file.padEnd(42)} 🆕 NEW CHUNK   did not exist in snapshot`);
    added++;
  } else {
    console.log(`${file.padEnd(42)} ❌ DELETED     existed in snapshot, gone now`);
    deleted++;
  }
}

console.log(SEP);
console.log(`Result: ${unchanged} unchanged, ${added} new, ${modified} modified, ${deleted} deleted\n`);
