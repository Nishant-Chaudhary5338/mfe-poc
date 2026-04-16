import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const deploysDir = resolve(__dirname, '../deploys');
const PORT = 4000;

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.map':  'application/json',
};

// Track active sessions per version for mid-session safety visibility
const sessionHits = {};

const server = createServer((req, res) => {
  // Add CORS headers so the shell (port 3000) can load these assets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const urlPath = req.url.split('?')[0];
  const filePath = resolve(deploysDir, '.' + urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(deploysDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const contents = readFileSync(filePath);
  const size = statSync(filePath).size;

  // Log JS requests with app/version context
  if (ext === '.js') {
    // Extract app + version from path: /sms/v1/assets/foo.js → [sms, v1]
    const parts = urlPath.split('/').filter(Boolean);
    const app     = parts[0] || '?';
    const version = parts[1] || '?';
    const file    = parts[parts.length - 1];
    const key     = `${app}/${version}`;

    sessionHits[key] = (sessionHits[key] || 0) + 1;

    const tag = file === 'remoteEntry.js' ? '[entry]' : '[chunk]';
    console.log(
      `  [${key}] ${tag.padEnd(8)} ${file.padEnd(44)} ${String(size).padStart(7)} bytes`
    );
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(contents);
});

server.listen(PORT, () => {
  console.log('\nVersioned Deploy Server');
  console.log('─'.repeat(68));
  console.log(`Serving:  deploys/`);
  console.log(`Base URL: http://localhost:${PORT}/<app>/<version>/assets/remoteEntry.js`);
  console.log('─'.repeat(68));
  console.log('\nAll JS requests will be logged below.\n');
  console.log(
    `  ${'[app/ver]'.padEnd(12)} ${'type'.padEnd(9)} ${'filename'.padEnd(44)} ${'size'.padStart(7)}`
  );
  console.log(
    `  ${'─'.repeat(12)} ${'─'.repeat(9)} ${'─'.repeat(44)} ${'─'.repeat(7)}`
  );
});
