const SKIP = new Set(['id', '_id', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'deletedAt', 'deleted_at']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;

function toLabel(name) {
  return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
    .split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function typeFromValue(key, value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    const k = key.toLowerCase();
    if (k.includes('password')) return 'password';
    if (k.includes('email') || EMAIL_RE.test(value)) return 'email';
    if (DATE_RE.test(value) || k.includes('date') || k.endsWith('_at') || k.endsWith('At')) return 'date';
    if (value.length > 120) return 'textarea';
    return 'text';
  }
  return null;
}

function typeFromOpenApi(prop, key) {
  const { type, format, enum: enumVals } = prop;
  if (enumVals?.length) return 'select';
  if (type === 'boolean') return 'boolean';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'string') {
    const k = key.toLowerCase();
    if (format === 'email' || k.includes('email')) return 'email';
    if (format === 'password' || k.includes('password')) return 'password';
    if (format === 'date' || format === 'date-time') return 'date';
    if (format === 'textarea' || k.includes('description') || k.includes('body') || k.includes('content') || k.includes('notes')) return 'textarea';
    return 'text';
  }
  return null;
}

function unwrap(obj) {
  if (Array.isArray(obj)) return obj.length > 0 ? obj[0] : obj;
  const wrappers = ['data', 'result', 'item', 'response', 'payload', 'record', 'object'];
  for (const key of wrappers) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) return obj[key];
  }
  for (const key of ['data', 'items', 'results', 'records', 'list']) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key][0];
  }
  return obj;
}

export function inferFields(input) {
  let parsed;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return { error: 'Empty input', fields: [] };
    try { parsed = JSON.parse(trimmed); } catch {
      return { error: 'Invalid JSON — paste a JSON sample response or OpenAPI schema object', fields: [] };
    }
  } else {
    parsed = input;
  }

  if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];

  const obj = unwrap(parsed);

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return { error: 'Expected a JSON object or array of objects', fields: [] };
  }

  // OpenAPI schema: has `properties`
  if (obj.properties && typeof obj.properties === 'object') {
    const required = new Set(obj.required || []);
    const fields = [];
    for (const [key, prop] of Object.entries(obj.properties)) {
      if (SKIP.has(key) || typeof prop !== 'object') continue;
      const type = typeFromOpenApi(prop, key);
      if (!type) continue;
      fields.push({ name: key, type, required: required.has(key), label: toLabel(key) });
    }
    return { fields, source: 'openapi', count: fields.length };
  }

  // Raw JSON sample response
  const fields = [];
  for (const [key, value] of Object.entries(obj)) {
    if (SKIP.has(key)) continue;
    const type = typeFromValue(key, value);
    if (!type) continue;
    fields.push({ name: key, type, required: true, label: toLabel(key) });
  }
  return { fields, source: 'sample', count: fields.length };
}
