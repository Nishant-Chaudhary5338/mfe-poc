import { createServer } from 'http';
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../apps/sms/dist');
const PORT = 4173;

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.map':  'application/json',
};

const server = createServer((req, res) => {
  // Default to index.html for SPA routing
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = resolve(distDir, '.' + urlPath);

  if (!existsSync(filePath) || !filePath.startsWith(distDir)) {
    // Fallback to index.html for client-side routes
    const indexPath = resolve(distDir, 'index.html');
    const html = readFileSync(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const contents = readFileSync(filePath);
  const size = statSync(filePath).size;

  // Only log JS chunk requests (skip index.html, sourcemaps, etc.)
  if (ext === '.js') {
    const fileName = urlPath.split('/').pop();
    const tag = fileName === 'remoteEntry.js' ? '[entry]' : '[chunk]';
    console.log(`  ${tag.padEnd(9)} ${fileName.padEnd(44)} ${String(size).padStart(7)} bytes`);
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(contents);
});

server.listen(PORT, () => {
  console.log('\nNetwork Verification Server');
  console.log('─'.repeat(68));
  console.log(`Serving: apps/sms/dist/`);
  console.log(`Open:    http://localhost:${PORT}`);
  console.log('─'.repeat(68));
  console.log('\nWatching requests...\n');
  console.log(`  ${'type'.padEnd(9)} ${'filename'.padEnd(44)} ${'size'.padStart(7)}`);
  console.log(`  ${'─'.repeat(9)} ${'─'.repeat(44)} ${'─'.repeat(7)}`);
});
