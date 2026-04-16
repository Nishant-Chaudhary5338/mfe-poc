import { useState, useRef, useEffect } from 'react';

interface DiffEntry {
  name: string; baseName?: string; size?: number; oldSize?: number; oldName?: string;
  source?: string; tag?: string; description?: string;
}
interface DiffResult {
  unchanged: DiffEntry[]; modified: DiffEntry[];
  added: DiffEntry[]; deleted: DiffEntry[];
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MFE:    { bg: '#FEF2EE', text: '#C2390F', border: '#FCBFAA' },
  Entry:  { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  Route:  { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  Vendor: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

const DIFF_COLORS = {
  added:     { accent: '#10B981', bg: '#F0FDF4', border: '#BBF7D0', text: '#065F46' },
  modified:  { accent: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#78350F' },
  deleted:   { accent: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#7F1D1D' },
  unchanged: { accent: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' },
};

function ChunkCard({ entry, color, bg, border, strikethrough }: { entry: DiffEntry; color: string; bg: string; border: string; strikethrough?: boolean }) {
  const tagStyle = entry.tag ? TAG_COLORS[entry.tag] : null;
  return (
    <div style={{
      background: bg, borderRadius: 8,
      border: `1px solid ${border}`,
      borderLeft: `3px solid ${color}`,
      padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {tagStyle && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)',
            padding: '2px 6px', borderRadius: 4,
            background: tagStyle.bg, color: tagStyle.text, border: `1px solid ${tagStyle.border}`,
          }}>{entry.tag}</span>
        )}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
          color: strikethrough ? 'var(--muted)' : 'var(--text)',
          textDecoration: strikethrough ? 'line-through' : 'none',
          flex: 1, wordBreak: 'break-all',
        }}>{entry.name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
          {entry.oldSize && <span style={{ color: '#EF4444', textDecoration: 'line-through', marginRight: 6 }}>{fmt(entry.oldSize)}</span>}
          {entry.size ? fmt(entry.size) : '—'}
        </span>
      </div>
      {entry.oldName && (
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
          was: {entry.oldName}
        </div>
      )}
      {entry.source && (
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{entry.source}</div>
      )}
      {entry.description && (
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{entry.description}</div>
      )}
    </div>
  );
}

function DiffSection({ title, entries, type, strikethrough }: {
  title: string; entries: DiffEntry[]; type: keyof typeof DIFF_COLORS; strikethrough?: boolean;
}) {
  if (entries.length === 0) return null;
  const c = DIFF_COLORS[type];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: c.bg, borderRadius: 6, border: `1px solid ${c.border}` }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.accent, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
        <span style={{ fontSize: 11, color: c.text, fontWeight: 500, opacity: 0.7 }}>· {entries.length} chunk{entries.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map(e => <ChunkCard key={e.name} entry={e} color={c.accent} bg={c.bg} border={c.border} strikethrough={strikethrough} />)}
      </div>
    </div>
  );
}

function DiffPanel({ diff }: { diff: DiffResult }) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const totalAdded = diff.added.reduce((s, e) => s + (e.size || 0), 0);
  const totalDeleted = diff.deleted.reduce((s, e) => s + (e.size || 0), 0);
  const delta = totalAdded - totalDeleted;

  return (
    <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Summary bar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: 'var(--surface)' }}>
        {[
          { label: 'Added',     count: diff.added.length,     c: DIFF_COLORS.added },
          { label: 'Modified',  count: diff.modified.length,  c: DIFF_COLORS.modified },
          { label: 'Deleted',   count: diff.deleted.length,   c: DIFF_COLORS.deleted },
          { label: 'Unchanged', count: diff.unchanged.length, c: DIFF_COLORS.unchanged },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: s.c.accent, lineHeight: 1 }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.c.text, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
        {delta !== 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontFamily: 'var(--font-mono)', color: delta > 0 ? DIFF_COLORS.modified.text : DIFF_COLORS.added.text, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: delta > 0 ? DIFF_COLORS.modified.bg : DIFF_COLORS.added.bg }}>
            {delta > 0 ? '+' : ''}{fmt(delta)}
          </span>
        )}
      </div>

      {/* Grouped diff */}
      <div style={{ padding: '16px 20px', maxHeight: 520, overflowY: 'auto' }}>
        <DiffSection title="Added"    entries={diff.added}    type="added" />
        <DiffSection title="Modified" entries={diff.modified} type="modified" />
        <DiffSection title="Deleted"  entries={diff.deleted}  type="deleted" strikethrough />

        {diff.unchanged.length > 0 && (
          <div>
            <button onClick={() => setShowUnchanged(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 12px', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-body)', marginBottom: showUnchanged ? 8 : 0, width: '100%',
            }}>
              <span style={{ transform: showUnchanged ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
              <span>{diff.unchanged.length} unchanged — no re-testing required</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--border)', padding: '2px 7px', borderRadius: 10, color: 'var(--muted)' }}>click to expand</span>
            </button>
            {showUnchanged && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {diff.unchanged.map(e => <ChunkCard key={e.name} entry={e} color={DIFF_COLORS.unchanged.accent} bg={DIFF_COLORS.unchanged.bg} border={DIFF_COLORS.unchanged.border} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AppSummary { id: string; added: number; modified: number; deleted: number; unchanged: number; }

function MultiAppDiff({ summaries }: { summaries: AppSummary[] }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>Plugin Isolation</span>
        <span style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 8px', borderRadius: 10, background: 'var(--border)' }}>All Remotes</span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {summaries.map(s => {
          const isNew = s.unchanged === 0 && s.added > 0 && s.modified === 0 && s.deleted === 0;
          const isClean = s.added === 0 && s.modified === 0 && s.deleted === 0;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 9,
              background: isNew ? DIFF_COLORS.added.bg : isClean ? 'var(--surface)' : 'var(--surface)',
              border: `1px solid ${isNew ? DIFF_COLORS.added.border : isClean ? '#BBF7D0' : 'var(--border)'}`,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: 'var(--text)', width: 36,
                padding: '2px 6px', borderRadius: 4,
                background: 'var(--border)', textAlign: 'center',
              }}>{s.id.toUpperCase()}</span>

              {isNew && <span style={{ fontSize: 11, color: DIFF_COLORS.added.text, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: DIFF_COLORS.added.bg, border: `1px solid ${DIFF_COLORS.added.border}` }}>NEW PLUGIN</span>}
              {isClean && !isNew && <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #BBF7D0' }}>✓ Isolated — no changes</span>}

              <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
                {([
                  { label: 'Added',     val: s.added,     c: DIFF_COLORS.added },
                  { label: 'Modified',  val: s.modified,  c: DIFF_COLORS.modified },
                  { label: 'Deleted',   val: s.deleted,   c: DIFF_COLORS.deleted },
                  { label: 'Unchanged', val: s.unchanged, c: DIFF_COLORS.unchanged },
                ] as const).map(({ label, val, c }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 3, opacity: val === 0 ? 0.35 : 1 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: c.accent }}>{val}</span>
                    <span style={{ fontSize: 10, color: c.text, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function fmt(bytes: number) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' kB';
  return bytes + ' B';
}

export default function BuildCompare() {
  const [appId, setAppId] = useState('sms');
  const [registeredApps, setRegisteredApps] = useState<{ id: string; label: string }[]>([]);
  const [log, setLog] = useState('');
  const [building, setBuilding] = useState(false);
  const [buildDone, setBuildDone] = useState(false);
  const [snapshotDone, setSnapshotDone] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [multiDiff, setMultiDiff] = useState<AppSummary[] | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  function refreshApps() {
    fetch('/api/apps').then(r => r.json()).then((apps: { id: string; label: string }[]) => {
      setRegisteredApps(apps);
    }).catch(() => {});
  }

  useEffect(() => { refreshApps(); }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Check if a snapshot already exists for this app on disk
  useEffect(() => {
    const id = appId === 'all' ? 'sms' : appId;
    fetch(`/api/compare?appId=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setSnapshotDone(true); })
      .catch(() => {});
  }, [appId]);

  async function handleBuild() {
    setBuilding(true);
    setBuildDone(false);
    // Do NOT reset snapshotDone — existing snapshot on disk stays valid as baseline
    setDiff(null);
    setLog('');

    const res = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n\n');
      buf = lines.pop() || '';
      for (const chunk of lines) {
        if (!chunk.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(chunk.slice(6));
          if (evt.type === 'stdout' || evt.type === 'stderr') {
            setLog(l => l + evt.line);
          } else if (evt.type === 'done' || evt.type === 'exit') {
            setBuildDone(true);
            setBuilding(false);
            setSnapshotDone(true);
          }
        } catch {}
      }
    }
    setBuilding(false);
    setBuildDone(true);
  }

  async function handleSnapshot() {
    setSnapshotting(true);
    const id = appId === 'all' ? 'sms' : appId;
    await fetch('/api/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: id }),
    });
    setSnapshotDone(true);
    setSnapshotting(false);
  }

  async function handleCompare() {
    if (appId === 'all') {
      const apps = registeredApps.map(a => a.id);
      const results = await Promise.all(apps.map(id =>
        fetch(`/api/compare?appId=${id}`).then(r => r.json())
      ));
      setMultiDiff(results.map((data, i) => ({
        id: apps[i],
        added: data.added?.length ?? 0,
        modified: data.modified?.length ?? 0,
        deleted: data.deleted?.length ?? 0,
        unchanged: data.unchanged?.length ?? 0,
      })));
      setDiff(null);
    } else {
      setMultiDiff(null);
      const res = await fetch(`/api/compare?appId=${appId}`);
      const data = await res.json();
      if (data.error) setDiff(null);
      else setDiff(data);
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Build & Compare</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Build plugins, snapshot dist/ chunks, and diff changes between builds</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Plugin selector */}
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plugin</span>
              <button onClick={refreshApps} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>↺</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...registeredApps, { id: 'all', label: 'All Remotes' }].map(a => {
                const active = appId === a.id;
                return (
                  <button key={a.id} onClick={() => { setAppId(a.id); setBuildDone(false); setSnapshotDone(false); setDiff(null); setMultiDiff(null); setLog(''); }} style={{
                    padding: '8px 12px', borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 500,
                    background: active ? 'var(--signal-soft)' : 'transparent',
                    color: active ? 'var(--signal)' : 'var(--muted)',
                    border: active ? '1.5px solid #C7D2FE' : '1.5px solid transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'var(--signal)' : 'var(--border)', flexShrink: 0 }} />
                    {a.label}
                    {active && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleBuild} disabled={building} style={{
              padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: building ? 'var(--border)' : 'linear-gradient(135deg, #1428A0 0%, #3B5BDB 100%)',
              color: building ? 'var(--muted)' : 'white', border: 'none',
              cursor: building ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: building ? 'none' : '0 2px 8px rgba(20,40,160,0.3)',
            }}>
              {building && <span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {building ? 'Building...' : `Build ${appId.toUpperCase()}`}
            </button>

            <div style={{ fontSize: 11, color: '#059669', padding: '7px 10px', borderRadius: 7, border: '1px solid #BBF7D0', background: '#F0FDF4', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> Snapshot auto-saved before each build
            </div>

            <button onClick={handleCompare} disabled={!snapshotDone} style={{
              padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: !snapshotDone ? 'var(--surface)' : 'var(--flame-soft)',
              color: !snapshotDone ? 'var(--subtle)' : 'var(--flame)',
              border: `1.5px solid ${!snapshotDone ? 'var(--border)' : '#FCBFAA'}`,
              cursor: !snapshotDone ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            }}>Compare Chunks</button>
          </div>

          {/* Workflow guide */}
          <div style={{ background: 'var(--signal-soft)', borderRadius: 10, padding: 14, border: '1px solid #C7D2FE' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--signal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workflow</div>
            {[
              'Build → baseline auto-saved',
              'Add a route or make changes',
              'Rebuild → Compare',
              'Shell auto-reloads in ~5s',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5, fontSize: 12, color: '#3730A3' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--signal)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Output panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Build log — keep dark terminal style */}
          <div style={{ borderRadius: 12, border: '1px solid #1E293B', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1E293B', background: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#EF4444','#F59E0B','#10B981'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
              </div>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>build output</span>
              {building && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                running
              </span>}
              {buildDone && !building && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#10B981' }}>✓ complete</span>}
            </div>
            <div ref={logRef} style={{
              height: 240, overflowY: 'auto', padding: '14px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#94A3B8',
              lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              background: '#0F172A',
            }}>
              {log || <span style={{ color: '#334155' }}>Run a build to see output here...</span>}
            </div>
          </div>

          {/* Diff result */}
          {multiDiff && <MultiAppDiff summaries={multiDiff} />}
          {diff && <DiffPanel diff={diff} />}
        </div>
      </div>
    </div>
  );
}
