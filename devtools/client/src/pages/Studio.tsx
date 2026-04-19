import { useState, useEffect } from 'react';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useToast } from '../components/Toast.tsx';

type StudioTab = 'login' | 'form' | 'detail' | 'crud' | 'review' | 'ixd';

const TABS: { id: StudioTab; label: string; icon: string }[] = [
  { id: 'login',  label: 'Login',  icon: '🔑' },
  { id: 'form',   label: 'Form',   icon: '📝' },
  { id: 'detail', label: 'Detail', icon: '🔍' },
  { id: 'crud',   label: 'CRUD',   icon: '⚡' },
  { id: 'review', label: 'Review', icon: '🎯' },
  { id: 'ixd',    label: 'IXD',    icon: '🎨' },
];

const fieldTypes = ['text', 'email', 'password', 'number', 'textarea', 'boolean', 'date', 'select'] as const;
type FieldType = typeof fieldTypes[number];

interface Field { name: string; type: FieldType; required: boolean; label: string; }

function useApps() {
  const [apps, setApps] = useState<{ id: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/apps')
      .then(r => { if (!r.ok) throw new Error('Server error'); return r.json(); })
      .then(setApps)
      .catch(() => setError('DevTools server offline — run: pnpm devtools'));
  }, []);
  return { apps, appsError: error };
}

// ── Shared components ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{children}</label>;
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6,
        border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
        fontFamily: 'var(--font-body)',
      }}
    />
  );
}

function AppSelect({ value, onChange, apps }: { value: string; onChange: (v: string) => void; apps: { id: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6,
        border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <option value="">Select plugin…</option>
      {apps.map(a => <option key={a.id} value={a.id}>{a.label} ({a.id})</option>)}
    </select>
  );
}

function SchemaInfer({ onFields }: { onFields: (f: Field[]) => void }) {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState('');
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function infer() {
    if (!doc.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch('/api/infer-fields', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiDoc: doc }) });
      const d = await r.json();
      if (d.error) { setStatus({ msg: d.error, ok: false }); return; }
      if (!d.fields?.length) { setStatus({ msg: 'No fields found in schema', ok: false }); return; }
      onFields(d.fields);
      setStatus({ msg: `${d.fields.length} fields inferred from ${d.source}`, ok: true });
    } catch { setStatus({ msg: 'Server error', ok: false }); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '7px 12px', background: 'var(--surface)', border: 'none', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--signal)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>⚡ Paste API schema to auto-fill fields</span>
        <span style={{ opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Paste a JSON sample response or OpenAPI schema object</p>
          <textarea
            value={doc}
            onChange={e => { setDoc(e.target.value); setStatus(null); }}
            placeholder={'{\n  "title": "My Article",\n  "email": "user@example.com",\n  "count": 42\n}\n\n// or OpenAPI:\n{\n  "properties": { "title": { "type": "string" } },\n  "required": ["title"]\n}'}
            style={{ width: '100%', height: 120, padding: '7px 9px', fontSize: 11, fontFamily: 'var(--font-mono)', borderRadius: 5, border: '1px solid var(--border)', background: '#12141E', color: '#CDD6F4', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {status && (
            <p style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: status.ok ? '#10B981' : 'var(--red)' }}>
              {status.ok ? '✓' : '⚠'} {status.msg}
            </p>
          )}
          <button
            onClick={infer}
            disabled={loading || !doc.trim()}
            style={{ marginTop: 6, width: '100%', padding: '7px', borderRadius: 6, border: 'none', background: loading ? 'var(--border)' : 'var(--signal)', color: 'white', fontSize: 12, fontWeight: 600, cursor: loading || !doc.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}
          >{loading ? 'Inferring…' : 'Infer Fields'}</button>
        </div>
      )}
    </div>
  );
}

function FieldsEditor({ fields, onChange }: { fields: Field[]; onChange: (f: Field[]) => void }) {
  function add() { onChange([...fields, { name: '', type: 'text', required: true, label: '' }]); }
  function remove(i: number) { onChange(fields.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<Field>) { onChange(fields.map((f, idx) => idx === i ? { ...f, ...patch } : f)); }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Label>Fields</Label>
        <button
          onClick={add}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--signal)', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >+ Add field</button>
      </div>
      {fields.length === 0 && <p style={{ fontSize: 12, color: 'var(--subtle)', fontStyle: 'italic' }}>No fields — will auto-detect from response.</p>}
      {fields.map((f, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input
            placeholder="name"
            value={f.name}
            onChange={e => update(i, { name: e.target.value })}
            style={{ padding: '6px 8px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--card)', fontFamily: 'var(--font-body)' }}
          />
          <select
            value={f.type}
            onChange={e => update(i, { type: e.target.value as FieldType })}
            style={{ padding: '6px 8px', fontSize: 12, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--card)', fontFamily: 'var(--font-body)' }}
          >
            {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={f.required} onChange={e => update(i, { required: e.target.checked })} />
            req
          </label>
          <button
            onClick={() => remove(i)}
            style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}

function CodePreview({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {filename && (
        <div style={{ padding: '8px 14px', background: '#1A1D27', borderBottom: '1px solid #2D3148', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#7C85B3', fontFamily: 'var(--font-mono)' }}>{filename}</span>
          <button
            onClick={copy}
            style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4, border: '1px solid #2D3148', background: copied ? '#10B98122' : 'transparent', color: copied ? '#10B981' : '#7C85B3', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
      )}
      <pre style={{
        flex: 1, margin: 0, padding: '16px', overflow: 'auto',
        background: '#12141E', color: '#CDD6F4', fontSize: 12, lineHeight: 1.65,
        fontFamily: 'var(--font-mono)', borderRadius: filename ? '0 0 8px 8px' : 8,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {code}
      </pre>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontWeight: 500 }}>⚠ {msg}</p>;
}

function GenBtn({ onClick, loading, error }: { onClick: () => void; loading: boolean; error?: string }) {
  return (
    <div>
      {error && <FieldError msg={error} />}
      <PermissionGate roles={['admin', 'ops', 'editor']} mode="disable" style={{ display: 'block' }}>
        <button
          onClick={onClick}
          disabled={loading}
          style={{
            width: '100%', padding: '9px', borderRadius: 7, border: 'none',
            background: loading ? 'var(--border)' : 'var(--signal)', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', marginTop: 8,
          }}
        >{loading ? 'Generating…' : 'Generate'}</button>
      </PermissionGate>
    </div>
  );
}

function WriteBtn({ onClick, loading, written }: { onClick: () => void; loading: boolean; written: boolean }) {
  return (
    <PermissionGate roles={['admin', 'ops', 'editor']} mode="disable" style={{ display: 'block' }}>
      <button
        onClick={onClick}
        disabled={loading || written}
        style={{
          width: '100%', padding: '9px', borderRadius: 7,
          background: written ? '#10B98122' : '#10B981',
          color: written ? '#10B981' : 'white',
          border: written ? '1px solid #10B98133' : 'none',
          fontSize: 13, fontWeight: 600, cursor: (loading || written) ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)', marginTop: 6,
        }}
      >{written ? '✓ Written to app' : loading ? 'Writing…' : 'Write to app + Add route'}</button>
    </PermissionGate>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────

function PanelLayout({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {left}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {right}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ── Login tab ─────────────────────────────────────────────────────────────────

function LoginTab({ apps }: { apps: { id: string; label: string }[] }) {
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [endpoint, setEndpoint] = useState('/api/auth/login');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(false);
  const [genError, setGenError] = useState('');

  async function generate() {
    if (!appId) { setGenError('Select a plugin first'); return; }
    setGenError('');
    setLoading(true);
    try {
      const r = await fetch('/api/generate/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, endpoint }) });
      const d = await r.json();
      setCode(d.code || d.error || '');
      setWritten(false);
      if (d.code) toast.info('Code generated', 'Review before writing to app');
    } finally { setLoading(false); }
  }

  async function write() {
    setWriting(true);
    try {
      await fetch('/api/generate/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, endpoint, addRoute: true }) });
      setWritten(true);
      toast.success('Route added', `Login page written to ${appId}`);
    } finally { setWriting(false); }
  }

  return (
    <PanelLayout
      left={<>
        <Row label="Plugin"><AppSelect value={appId} onChange={v => { setAppId(v); setGenError(''); }} apps={apps} /></Row>
        <Row label="Auth endpoint"><TextInput value={endpoint} onChange={setEndpoint} placeholder="/api/auth/login" /></Row>
        <GenBtn onClick={generate} loading={loading} error={genError} />
        {code && <WriteBtn onClick={write} loading={writing} written={written} />}
      </>}
      right={code ? <CodePreview code={code} filename="Login.tsx" /> : <EmptyState msg="Select a plugin and generate a login page" />}
    />
  );
}

// ── Form tab ──────────────────────────────────────────────────────────────────

function FormTab({ apps }: { apps: { id: string; label: string }[] }) {
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [pageName, setPageName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState<'POST' | 'PUT' | 'PATCH'>('POST');
  const [fields, setFields] = useState<Field[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(false);
  const [genError, setGenError] = useState('');

  async function generate() {
    if (!appId) { setGenError('Select a plugin first'); return; }
    if (fields.length === 0) { setGenError('Add at least one field'); return; }
    setGenError('');
    setLoading(true);
    try {
      const r = await fetch('/api/generate/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, pageName, endpoint, method, fields }) });
      const d = await r.json();
      setCode(d.code || d.error || '');
      setWritten(false);
      if (d.code) toast.info('Code generated', 'Review before writing to app');
    } finally { setLoading(false); }
  }

  async function write() {
    setWriting(true);
    try {
      await fetch('/api/generate/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, pageName, endpoint, method, fields, addRoute: true }) });
      setWritten(true);
      toast.success('Route added', `${pageName || 'Form'} page written to ${appId}`);
    } finally { setWriting(false); }
  }

  return (
    <PanelLayout
      left={<>
        <Row label="Plugin"><AppSelect value={appId} onChange={v => { setAppId(v); setGenError(''); }} apps={apps} /></Row>
        <Row label="Page name"><TextInput value={pageName} onChange={setPageName} placeholder="CreateArticle" /></Row>
        <Row label="Endpoint"><TextInput value={endpoint} onChange={setEndpoint} placeholder="/api/articles" /></Row>
        <Row label="Method">
          <select value={method} onChange={e => setMethod(e.target.value as typeof method)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', fontFamily: 'var(--font-body)' }}>
            <option>POST</option><option>PUT</option><option>PATCH</option>
          </select>
        </Row>
        <SchemaInfer onFields={f => { setFields(f); setGenError(''); }} />
        <FieldsEditor fields={fields} onChange={f => { setFields(f); setGenError(''); }} />
        <GenBtn onClick={generate} loading={loading} error={genError} />
        {code && <WriteBtn onClick={write} loading={writing} written={written} />}
      </>}
      right={code ? <CodePreview code={code} filename={`${pageName || 'Form'}Page.tsx`} /> : <EmptyState msg="Add fields and generate a form with Zod validation" />}
    />
  );
}

// ── Detail tab ────────────────────────────────────────────────────────────────

function DetailTab({ apps }: { apps: { id: string; label: string }[] }) {
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [pageName, setPageName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(false);
  const [genError, setGenError] = useState('');

  async function generate() {
    if (!appId) { setGenError('Select a plugin first'); return; }
    setGenError('');
    setLoading(true);
    try {
      const r = await fetch('/api/generate/detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, pageName, endpoint, fields }) });
      const d = await r.json();
      setCode(d.code || d.error || '');
      setWritten(false);
      if (d.code) toast.info('Code generated', 'Review before writing to app');
    } finally { setLoading(false); }
  }

  async function write() {
    setWriting(true);
    try {
      await fetch('/api/generate/detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, pageName, endpoint, fields, addRoute: true }) });
      setWritten(true);
      toast.success('Route added', `${pageName || 'Detail'} page written to ${appId}`);
    } finally { setWriting(false); }
  }

  return (
    <PanelLayout
      left={<>
        <Row label="Plugin"><AppSelect value={appId} onChange={v => { setAppId(v); setGenError(''); }} apps={apps} /></Row>
        <Row label="Resource name"><TextInput value={pageName} onChange={setPageName} placeholder="Article" /></Row>
        <Row label="Endpoint"><TextInput value={endpoint} onChange={setEndpoint} placeholder="/api/articles/:id" /></Row>
        <SchemaInfer onFields={setFields} />
        <FieldsEditor fields={fields} onChange={setFields} />
        <GenBtn onClick={generate} loading={loading} error={genError} />
        {code && <WriteBtn onClick={write} loading={writing} written={written} />}
      </>}
      right={code ? <CodePreview code={code} filename={`${pageName || 'Resource'}DetailPage.tsx`} /> : <EmptyState msg="Configure and generate a detail view page" />}
    />
  );
}

// ── CRUD tab ──────────────────────────────────────────────────────────────────

interface CrudPages { list: { code: string; filename: string }; detail: { code: string; filename: string }; form: { code: string; filename: string }; editForm: { code: string; filename: string } }

function CrudTab({ apps }: { apps: { id: string; label: string }[] }) {
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [resource, setResource] = useState('');
  const [baseEndpoint, setBaseEndpoint] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [pages, setPages] = useState<CrudPages | null>(null);
  const [activeFile, setActiveFile] = useState<keyof CrudPages>('list');
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState(false);
  const [genError, setGenError] = useState('');

  async function generate() {
    if (!appId) { setGenError('Select a plugin first'); return; }
    if (fields.length === 0) { setGenError('Add at least one field'); return; }
    setGenError('');
    setLoading(true);
    try {
      const r = await fetch('/api/generate/crud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, resource, baseEndpoint, fields }) });
      const d = await r.json();
      if (d.pages) { setPages(d.pages); setActiveFile('list'); setWritten(false); toast.info('CRUD generated', '4 files ready — review before writing'); }
      else setPages(null);
    } finally { setLoading(false); }
  }

  async function write() {
    setWriting(true);
    try {
      await fetch('/api/generate/crud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, resource, baseEndpoint, fields, addRoute: true }) });
      setWritten(true);
      toast.success('CRUD routes added', `4 pages written to ${appId}`);
    } finally { setWriting(false); }
  }

  const fileKeys: (keyof CrudPages)[] = ['list', 'detail', 'form', 'editForm'];

  return (
    <PanelLayout
      left={<>
        <Row label="Plugin"><AppSelect value={appId} onChange={setAppId} apps={apps} /></Row>
        <Row label="Resource (singular)"><TextInput value={resource} onChange={setResource} placeholder="Article" /></Row>
        <Row label="Base endpoint"><TextInput value={baseEndpoint} onChange={setBaseEndpoint} placeholder="/api/articles" /></Row>
        <SchemaInfer onFields={f => { setFields(f); setGenError(''); }} />
        <FieldsEditor fields={fields} onChange={f => { setFields(f); setGenError(''); }} />
        <GenBtn onClick={generate} loading={loading} error={genError} />
        {pages && <WriteBtn onClick={write} loading={writing} written={written} />}
        {pages && (
          <div style={{ background: 'var(--surface)', borderRadius: 7, padding: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>GENERATED FILES</p>
            {fileKeys.map(k => (
              <div key={k} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}>
                ✓ {pages[k].filename}
              </div>
            ))}
          </div>
        )}
      </>}
      right={pages ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* File tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {fileKeys.map(k => (
              <button
                key={k}
                onClick={() => setActiveFile(k)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                  background: activeFile === k ? '#1A1D27' : 'var(--surface)',
                  color: activeFile === k ? '#CDD6F4' : 'var(--muted)',
                }}
              >{pages[k].filename}</button>
            ))}
          </div>
          <CodePreview code={pages[activeFile].code} filename={pages[activeFile].filename} />
        </div>
      ) : <EmptyState msg="Generate complete CRUD suite: List + Detail + Form + EditForm in one click" />}
    />
  );
}

// ── Review tab ────────────────────────────────────────────────────────────────

function ReviewTab({ apps }: { apps: { id: string; label: string }[] }) {
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runError, setRunError] = useState('');

  async function run() {
    if (!appId) { setRunError('Select a plugin first'); return; }
    setRunError('');
    setLoading(true);
    try {
      const r = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId }) });
      const d = await r.json();
      setResult(d);
      const grade = d.grade ?? '?';
      if (['A','B'].includes(grade)) toast.success(`Grade ${grade}`, `${d.issues?.length || 0} issues found`);
      else toast.info(`Grade ${grade}`, `${d.issues?.length || 0} issues — review results`);
    } finally { setLoading(false); }
  }

  const gradeColor = (g: string) => ({ A: '#10B981', B: '#22C55E', C: '#F59E0B', D: '#F97316', F: '#EF4444' })[g] ?? 'var(--muted)';

  return (
    <PanelLayout
      left={<>
        <Row label="Plugin"><AppSelect value={appId} onChange={v => { setAppId(v); setRunError(''); }} apps={apps} /></Row>
        {runError && <FieldError msg={runError} />}
        <button
          onClick={run}
          disabled={loading}
          style={{
            width: '100%', padding: '9px', borderRadius: 7, border: 'none',
            background: loading ? 'var(--border)' : '#7C3AED', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', marginTop: 8,
          }}
        >{loading ? 'Reviewing…' : 'Run Review'}</button>
        {result && (
          <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: gradeColor(result.grade), fontFamily: 'var(--font-head)', lineHeight: 1 }}>{result.grade}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>TypeScript {result.tscOk ? '✓ OK' : `✗ ${result.tsErrors} errors`}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{result.issues?.length || 0} issues</div>
              </div>
            </div>
            {result.issues?.map((issue: any, i: number) => (
              <div key={i} style={{ fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--border)', color: issue.severity === 'error' ? 'var(--red)' : 'var(--amber)' }}>
                [{issue.severity}] {issue.rule}: {issue.msg}
              </div>
            ))}
          </div>
        )}
      </>}
      right={result ? <CodePreview code={JSON.stringify(result, null, 2)} filename="review-report.json" /> : <EmptyState msg="Run TypeScript checks + code quality analysis. Get a grade from A–F." />}
    />
  );
}

// ── IXD tab ───────────────────────────────────────────────────────────────────

const TURBOREPO_UI = '/Users/nishantchaudhary/Developer/mfe-poc/packages/shared-ui/src/components';

type IXDStatus = 'idle' | 'loading' | 'ok' | 'error';
type IXDPanel = 'preview' | 'catalog';

function IXDTab() {
  const [filePath, setFilePath]     = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [fileStatus, setFileStatus] = useState<IXDStatus>('idle');
  const [fileMeta, setFileMeta]     = useState<Record<string, unknown> | null>(null);
  const [imageB64, setImageB64]     = useState<string | null>(null);
  const [imageMime, setImageMime]   = useState('image/png');
  const [fileErr, setFileErr]       = useState('');

  const [catalogDir, setCatalogDir] = useState(TURBOREPO_UI);
  const [catalogPkg, setCatalogPkg] = useState('@repo/shared-ui');
  const [catStatus, setCatStatus]   = useState<IXDStatus>('idle');
  const [catalog, setCatalog]       = useState<{ totalComponents: number; catalog: string } | null>(null);
  const [catErr, setCatErr]         = useState('');

  const [activePanel, setActivePanel] = useState<IXDPanel>('preview');

  const isPdf = filePath.toLowerCase().endsWith('.pdf');

  async function checkPageCount() {
    if (!filePath || !isPdf) return;
    try {
      const r = await fetch('/api/ixd/list-pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath }) });
      const d = await r.json();
      if (d.totalPages) setTotalPages(d.totalPages);
    } catch {}
  }

  async function readFile() {
    if (!filePath) return;
    setFileStatus('loading'); setFileMeta(null); setImageB64(null); setFileErr('');
    try {
      const r = await fetch('/api/ixd/read-file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath, page }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setFileMeta(d.meta);
      if (d.image?.data) { setImageB64(d.image.data); setImageMime(d.image.mimeType || 'image/png'); }
      if ((d.meta as any)?.totalPages) setTotalPages((d.meta as any).totalPages);
      setFileStatus('ok');
      setActivePanel('preview');
    } catch (e: unknown) { setFileErr(e instanceof Error ? e.message : String(e)); setFileStatus('error'); }
  }

  async function loadCatalog() {
    setCatStatus('loading'); setCatalog(null); setCatErr('');
    try {
      const r = await fetch('/api/ixd/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ componentsDir: catalogDir, packageName: catalogPkg }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setCatalog(d); setCatStatus('ok'); setActivePanel('catalog');
    } catch (e: unknown) { setCatErr(e instanceof Error ? e.message : String(e)); setCatStatus('error'); }
  }

  const inputSt: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' };
  const btnPrimary = (bg = 'var(--signal)'): React.CSSProperties => ({ width: '100%', padding: '8px', borderRadius: 6, border: 'none', background: bg, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 6 });
  const statusColor: Record<IXDStatus, string> = { idle: 'var(--subtle)', loading: '#F59E0B', ok: 'var(--green)', error: 'var(--red)' };
  const statusLabel: Record<IXDStatus, string> = { idle: '○', loading: '◌', ok: '●', error: '✕' };

  return (
    <PanelLayout
      left={<>
        {/* File section */}
        <div style={{ padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Design File
            <span style={{ marginLeft: 6, color: statusColor[fileStatus] }}>{statusLabel[fileStatus]}</span>
          </div>
          <Label>Path (PDF or image)</Label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input style={{ ...inputSt, flex: 1 }} placeholder="/path/to/screen.pdf" value={filePath}
              onChange={e => { setFilePath(e.target.value); setTotalPages(null); setFileStatus('idle'); }}
              onBlur={checkPageCount} />
            <label style={{ flexShrink: 0, padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
              title="Browse — full path auto-fills if running in Electron, otherwise type the path">
              Browse
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  // `path` is available in Electron; plain browser returns undefined
                  const fullPath = (f as File & { path?: string }).path || f.name;
                  setFilePath(fullPath);
                  setTotalPages(null);
                  setFileStatus('idle');
                  e.target.value = '';
                }} />
            </label>
          </div>
          {isPdf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Label>Page</Label>
              <input type="number" min={1} max={totalPages || 999} value={page}
                onChange={e => setPage(Number(e.target.value))}
                style={{ ...inputSt, width: 60, textAlign: 'center' }} />
              {totalPages && <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>/ {totalPages}</span>}
            </div>
          )}
          {fileErr && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>✕ {fileErr}</p>}
          <button style={btnPrimary()} onClick={readFile} disabled={!filePath || fileStatus === 'loading'}>
            {fileStatus === 'loading' ? 'Reading…' : '▶ Read File'}
          </button>
        </div>

        {/* Catalog section */}
        <div style={{ padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            UI Catalog
            <span style={{ marginLeft: 6, color: statusColor[catStatus] }}>{statusLabel[catStatus]}</span>
            {catalog && <span style={{ marginLeft: 4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({catalog.totalComponents})</span>}
          </div>
          <Label>Components Dir</Label>
          <input style={inputSt} value={catalogDir} onChange={e => setCatalogDir(e.target.value)} />
          <Label>Package Name</Label>
          <input style={{ ...inputSt, marginTop: 4 }} value={catalogPkg} onChange={e => setCatalogPkg(e.target.value)} />
          {catErr && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>✕ {catErr}</p>}
          <button style={btnPrimary('#7C3AED')} onClick={loadCatalog} disabled={!catalogDir || catStatus === 'loading'}>
            {catStatus === 'loading' ? 'Scanning…' : '▶ Load Catalog'}
          </button>
        </div>

        {/* Hint */}
        {(imageB64 || catalog) && (
          <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--signal-soft)', border: '1px solid var(--signal-border)', fontSize: 11, color: 'var(--signal)', fontWeight: 500 }}>
            Use <code style={{ fontFamily: 'var(--font-mono)' }}>read_design_file</code> + <code style={{ fontFamily: 'var(--font-mono)' }}>get_ui_catalog</code> in Claude/Cline to generate the React layout.
          </div>
        )}
      </>}

      right={
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Panel toggle */}
          {(imageB64 || catalog) && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {(['preview', 'catalog'] as IXDPanel[]).map(p => (
                <button key={p} onClick={() => setActivePanel(p)}
                  style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', fontFamily: 'var(--font-body)', background: activePanel === p ? '#1A1D27' : 'var(--surface)', color: activePanel === p ? '#CDD6F4' : 'var(--muted)' }}>
                  {p === 'preview' ? '🖼 Preview' : `📦 Catalog${catalog ? ` (${catalog.totalComponents})` : ''}`}
                </button>
              ))}
              {fileMeta && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
                  {(fileMeta as any).width}×{(fileMeta as any).height}px · {(fileMeta as any).source?.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Preview panel */}
          {activePanel === 'preview' && (
            imageB64
              ? <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto', background: '#f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <img src={`data:${imageMime};base64,${imageB64}`} alt="IXD preview" style={{ maxWidth: '100%', display: 'block' }} />
                </div>
              : <EmptyState msg="Paste a file path and click Read File to see a preview of what the MCP tool extracted" />
          )}

          {/* Catalog panel */}
          {activePanel === 'catalog' && (
            catalog
              ? <CodePreview code={catalog.catalog} filename={`${catalogPkg} — ${catalog.totalComponents} components`} />
              : <EmptyState msg="Click Load Catalog to scan your shared UI components directory" />
          )}
        </div>
      }
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--subtle)', gap: 8 }}>
      <div style={{ fontSize: 32 }}>⚡</div>
      <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 280 }}>{msg}</p>
    </div>
  );
}

// ── Main Studio ───────────────────────────────────────────────────────────────

export default function Studio() {
  const toast = useToast();
  const [tab, setTab] = useState<StudioTab>('crud');
  const { apps, appsError } = useApps();

  useEffect(() => {
    if (appsError) toast.error('API offline', 'Run: pnpm devtools');
  }, [appsError]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px - 56px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Code Studio
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Generate production-ready pages for any plugin</p>
        {appsError && (
          <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', fontSize: 12, fontWeight: 500 }}>
            ⚠ {appsError}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: '7px 7px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? 'var(--card)' : 'transparent',
              border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
              borderBottom: tab === t.id ? '1px solid var(--card)' : '1px solid var(--border)',
              color: tab === t.id ? 'var(--signal)' : 'var(--muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              marginBottom: tab === t.id ? -1 : 0,
            }}
          >{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)', padding: 20, overflow: 'auto' }}>
        {tab === 'login'  && <LoginTab  apps={apps} />}
        {tab === 'form'   && <FormTab   apps={apps} />}
        {tab === 'detail' && <DetailTab apps={apps} />}
        {tab === 'crud'   && <CrudTab   apps={apps} />}
        {tab === 'review' && <ReviewTab apps={apps} />}
        {tab === 'ixd'    && <IXDTab />}
      </div>
    </div>
  );
}
