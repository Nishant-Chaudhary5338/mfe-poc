import { cpSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const [appName, version] = process.argv.slice(2);

if (!appName || !version) {
  console.error('Usage: node scripts/deploy.js <app> <version>');
  console.error('  e.g. node scripts/deploy.js sms v1');
  process.exit(1);
}

const srcDir  = resolve(__dirname, `../apps/${appName}/dist`);
const destDir = resolve(__dirname, `../deploys/${appName}/${version}`);

// Copy dist → deploys/<app>/<version>/
mkdirSync(destDir, { recursive: true });
cpSync(srcDir, destDir, { recursive: true });

// Write audit metadata
writeFileSync(
  resolve(destDir, 'deploy-meta.json'),
  JSON.stringify({ app: appName, version, deployedAt: new Date().toISOString() }, null, 2)
);

// Log what was copied
function walkAndLog(dir, base = dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const rel  = relative(base, full);
    if (statSync(full).isDirectory()) {
      walkAndLog(full, base);
    } else {
      const size = statSync(full).size;
      console.log(`  ${rel.padEnd(56)} ${String(size).padStart(8)} bytes`);
    }
  }
}

console.log(`\nDeploying ${appName} → ${version}`);
console.log('─'.repeat(68));
walkAndLog(destDir);
console.log('─'.repeat(68));
console.log(`Done. Deployed to: deploys/${appName}/${version}/`);
console.log(`Serve with: node scripts/serve-deploys.js`);
console.log(`Activate with: node scripts/use-version.js ${appName} ${version}\n`);
