import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../apps/sms/dist/assets');
const outFile = resolve(__dirname, 'snapshot.json');

const files = readdirSync(distDir).filter(
  (f) => f.endsWith('.js') && f !== 'remoteEntry.js'
);

const snapshot = {};

for (const file of files) {
  const filePath = resolve(distDir, file);
  const contents = readFileSync(filePath);
  const size = statSync(filePath).size;
  const md5 = createHash('md5').update(contents).digest('hex');
  snapshot[file] = { size, md5 };
}

writeFileSync(outFile, JSON.stringify(snapshot, null, 2));

console.log(`Snapshot saved to scripts/snapshot.json`);
console.log(`Captured ${files.length} chunks:\n`);
for (const [name, { size, md5 }] of Object.entries(snapshot)) {
  console.log(`  ${name.padEnd(40)} ${String(size).padStart(7)} bytes   md5: ${md5}`);
}
