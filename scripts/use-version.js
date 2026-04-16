import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const [appId, version] = process.argv.slice(2);

if (!appId || !version) {
  console.error('Usage: node scripts/use-version.js <app> <version>');
  console.error('  e.g. node scripts/use-version.js sms v1');
  console.error('  e.g. node scripts/use-version.js sms v2   ← upgrade');
  console.error('  e.g. node scripts/use-version.js sms v1   ← rollback');
  process.exit(1);
}

const registryPath = resolve(__dirname, '../apps/shell/public/registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));

const entry = registry.find((r) => r.id === appId);
if (!entry) {
  console.error(`No app with id "${appId}" found in registry.json`);
  console.error(`Available: ${registry.map((r) => r.id).join(', ')}`);
  process.exit(1);
}

const oldUrl = entry.url;
const newUrl = `http://localhost:4000/${appId}/${version}/assets/remoteEntry.js`;

entry.url = newUrl;
writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(`\nRegistry updated — ${appId} is now on ${version}`);
console.log('─'.repeat(68));
console.log(`  Before: ${oldUrl}`);
console.log(`  After:  ${newUrl}`);
console.log('─'.repeat(68));
console.log(`\nRefresh http://localhost:3000 to load ${appId} ${version}.`);
console.log(`Users already on the old version continue working uninterrupted.\n`);
