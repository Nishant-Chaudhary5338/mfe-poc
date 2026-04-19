import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../../', import.meta.url).pathname;

export function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function appMeta(appId) {
  const regPath = join(ROOT, 'devtools/data/registry.json');
  const reg = JSON.parse(readFileSync(regPath, 'utf8'));
  const entry = reg.find(e => e.id === appId);
  const label = entry?.label || appId;
  let color = '#1428A0';
  const appTsxPath = join(ROOT, 'apps', appId, 'src', 'App.tsx');
  if (existsSync(appTsxPath)) {
    const m = readFileSync(appTsxPath, 'utf8').match(/const COLOR = '(#[0-9A-Fa-f]{3,8})'/);
    if (m) color = m[1];
  }
  return { label, color };
}

export function patchAppTsx(appDir, routeName, routePath) {
  const tsxPath = join(appDir, 'src', 'App.tsx');
  let src = readFileSync(tsxPath, 'utf8');
  const cName = cap(routeName);
  let modified = false;

  // Inject lazy import after the LAST existing lazy() declaration
  if (!src.includes(`import('./routes/${routeName}.tsx')`)) {
    const lastLazyIdx = src.lastIndexOf('= lazy(');
    if (lastLazyIdx !== -1) {
      const lineEnd = src.indexOf('\n', lastLazyIdx);
      src = src.slice(0, lineEnd + 1) +
        `const ${cName} = lazy(() => import('./routes/${routeName}.tsx'));\n` +
        src.slice(lineEnd + 1);
      modified = true;
    } else {
      console.warn(`[patchAppTsx] Could not find lazy() import in ${tsxPath} — add manually:\nconst ${cName} = lazy(() => import('./routes/${routeName}.tsx'));`);
    }
  }

  // Inject NavLink before the closing nav </div>
  if (!src.includes(`to="${routePath}"`)) {
    const replaced = src.replace(
      /(<NavLink[^>]*>[^<]*<\/NavLink>)(\s*<\/div>)/,
      `$1\n          <NavLink to="${routePath}" style={({ isActive }) => tab(isActive)}>${cName}</NavLink>$2`
    );
    if (replaced !== src) {
      src = replaced;
      modified = true;
    } else {
      console.warn(`[patchAppTsx] Could not inject NavLink for "${routePath}" in ${tsxPath} — add manually.`);
    }
  }

  // Inject Route before </Routes>
  if (!src.includes(`path="${routePath}"`)) {
    const replaced = src.replace(
      /(<\/Routes>)/,
      `              <Route path="${routePath}" element={<${cName} />} />\n            $1`
    );
    if (replaced !== src) {
      src = replaced;
      modified = true;
    } else {
      console.warn(`[patchAppTsx] Could not inject Route for "${routePath}" in ${tsxPath} — add manually.`);
    }
  }

  if (modified) writeFileSync(tsxPath, src);
  return { patched: modified, routeName, routePath };
}

export function writeRouteFile(appDir, filename, code) {
  writeFileSync(join(appDir, 'src', 'routes', filename), code);
}

export function fieldToZod(field) {
  const { name, type, required } = field;
  let chain = 'z.string()';
  if (type === 'email') chain = 'z.string().email()';
  else if (type === 'number') chain = 'z.coerce.number()';
  else if (type === 'boolean') chain = 'z.boolean()';
  else if (type === 'date') chain = 'z.string()';
  else if (type === 'select') chain = 'z.string()';
  // Add .min(1) for required text-like fields
  if (required && ['text', 'email', 'password', 'textarea', 'select'].includes(type)) {
    chain = chain.replace('z.string()', "z.string().min(1, 'Required')");
  }
  if (!required) chain += '.optional()';
  return `  ${name}: ${chain},`;
}
