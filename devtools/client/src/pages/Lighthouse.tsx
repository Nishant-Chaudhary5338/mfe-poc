import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast.tsx';

interface StaticAudit {
  appId: string;
  type: 'static' | 'live';
  score: number;
  issues: string[];
  timestamp: string;
  // live audit fields
  metrics?: {
    performance: number; accessibility: number; bestPractices: number; seo: number;
    fcp: number; lcp: number; tbt: number; cls: number; si: number;
  };
  audits?: { name: string; score: number; title: string; description: string }[];
}

interface AppEntry { id: string; label: string; port?: string }

const SCORE_COLOR = (s: number) =>
  s >= 90 ? '#059669' : s >= 50 ? '#D97706' : '#DC2626';

const SCORE_BG = (s: number) =>
  s >= 90 ? '#F0FDF4' : s >= 50 ? '#FFFBEB' : '#FEF2F2';

const SCORE_BORDER = (s: number) =>
  s >= 90 ? '#BBF7D0' : s >= 50 ? '#FDE68A' : '#FECACA';

const SCORE_LABEL = (s: number) =>
  s >= 90 ? 'Good' : s >= 50 ? 'Needs work' : 'Poor';

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--muted)' }}>—</div>
      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: SCORE_BG(score), border: `2px solid ${SCORE_BORDER(score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: SCORE_COLOR(score), fontFamily: 'var(--font-head)' }}>{score}</div>
      <span style={{ fontSize: 10, color: SCORE_COLOR(score), fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function CWVPill({ label, value, unit, target, lowerIsBetter = true }: { label: string; value: number | null; unit: string; target: number; lowerIsBetter?: boolean }) {
  if (value === null) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, alignItems: 'center', minWidth: 64 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', fontFamily: 'var(--font-head)' }}>—</span>
      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
  const good = lowerIsBetter ? value <= target : value >= target;
  const color = good ? '#059669' : '#D97706';
  const bg = good ? '#F0FDF4' : '#FFFBEB';
  const border = good ? '#BBF7D0' : '#FDE68A';
  const display = unit === 'ms' ? `${Math.round(value)}ms` : unit === 's' ? `${(value / 1000).toFixed(1)}s` : value.toFixed(3);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 7, alignItems: 'center', minWidth: 64 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'var(--font-head)' }}>{display}</span>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function IssueList({ issues }: { issues: string[] }) {
  if (issues.length === 0) return (
    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6, border: '1px solid #BBF7D0' }}>
      ✓ No static issues found
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {issues.map((issue, i) => (
        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: 'var(--text)' }}>
          <span style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }}>⚠</span>
          {issue}
        </div>
      ))}
    </div>
  );
}

function routeToPath(name: string): string {
  if (name.toLowerCase() === 'dashboard') return '/';
  return '/' + name.toLowerCase();
}

interface BatchResult {
  appId: string; url: string; success: boolean; error?: string;
  metrics?: StaticAudit['metrics']; score?: number; duration?: number; timestamp?: string;
}

function PluginCard({ app, result, batchResults, onStaticAudit, onLiveAudit, onSelectionChange, running }: {
  app: AppEntry;
  result: StaticAudit | null;
  batchResults: Record<string, BatchResult>;
  onStaticAudit: (id: string) => void;
  onLiveAudit: (id: string, url: string) => void;
  onSelectionChange: (appId: string, urls: string[]) => void;
  running: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [routes, setRoutes] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const port = app.port;
  const baseUrl = port ? `http://localhost:${port}` : '';

  useEffect(() => {
    fetch(`/api/apps/${app.id}/routes`)
      .then(r => r.json())
      .then((names: string[]) => {
        setRoutes(names);
        // Default: select root route
        const dashboard = names.find(n => n.toLowerCase() === 'dashboard');
        const defaultPath = dashboard ? '/' : names.length ? routeToPath(names[0]) : '/';
        const initial = new Set([defaultPath]);
        setChecked(initial);
        onSelectionChange(app.id, [...initial].map(p => baseUrl + p));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  function toggleRoute(path: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      onSelectionChange(app.id, [...next].map(p => baseUrl + p));
      return next;
    });
  }

  function toggleAll() {
    const allPaths = routes.map(routeToPath);
    const allChecked = allPaths.every(p => checked.has(p));
    const next = new Set(allChecked ? [] : allPaths);
    setChecked(next);
    onSelectionChange(app.id, [...next].map(p => baseUrl + p));
  }

  const selectedCount = checked.size;
  const firstCheckedUrl = baseUrl + ([...checked][0] ?? '/');

  return (
    <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: 'var(--border)', color: 'var(--text)' }}>{app.id.toUpperCase()}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{app.label}</span>
        {selectedCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--signal)', padding: '2px 7px', borderRadius: 10, background: 'var(--signal-soft)', border: '1px solid #C7D2FE' }}>
            {selectedCount} selected
          </span>
        )}
        {result && (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {result.type === 'live' ? 'Live' : 'Static'} · {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Score row */}
      <div style={{ padding: '16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <ScoreBadge score={result?.score ?? null} label="HTML" />
        {result?.metrics && <>
          <ScoreBadge score={result.metrics.performance}   label="Perf" />
          <ScoreBadge score={result.metrics.accessibility} label="A11y" />
          <ScoreBadge score={result.metrics.bestPractices} label="Best" />
          <ScoreBadge score={result.metrics.seo}           label="SEO" />
        </>}
        {!result && <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>No audit run yet</div>}

        {/* Single-route actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => onStaticAudit(app.id)} disabled={running}
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: running ? 0.5 : 1 }}>
            {running ? '…' : '⚡ Static'}
          </button>
          <button onClick={() => onLiveAudit(app.id, firstCheckedUrl)} disabled={running || !baseUrl || selectedCount === 0}
            title={firstCheckedUrl}
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1.5px solid #C7D2FE', background: 'var(--signal-soft)', color: 'var(--signal)', cursor: (running || !baseUrl) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: (running || !baseUrl) ? 0.5 : 1 }}>
            {running ? '…' : '🔦 Live'}
          </button>
        </div>
      </div>

      {/* Route checklist */}
      {routes.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Routes — select for batch</span>
            <button onClick={toggleAll} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {routes.every(n => checked.has(routeToPath(n))) ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {routes.map(name => {
              const path = routeToPath(name);
              const url = baseUrl + path;
              const br = batchResults[url];
              return (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 5, background: checked.has(path) ? 'var(--signal-soft)' : 'transparent', border: `1px solid ${checked.has(path) ? '#C7D2FE' : 'transparent'}` }}>
                  <input type="checkbox" checked={checked.has(path)} onChange={() => toggleRoute(path)}
                    style={{ accentColor: 'var(--signal)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', flex: 1 }}>{url}</span>
                  {br && (
                    br.success
                      ? <span style={{ fontSize: 10, fontWeight: 700, color: SCORE_COLOR(br.metrics?.performance ?? 0), flexShrink: 0 }}>
                          {br.metrics?.performance ?? '—'} perf · {br.duration ? `${(br.duration / 1000).toFixed(1)}s` : ''}
                        </span>
                      : <span style={{ fontSize: 10, color: '#DC2626', flexShrink: 0 }}>✕ {br.error?.slice(0, 40)}</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}


      {/* CWV row (live only) */}
      {result?.metrics && (
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CWVPill label="LCP" value={result.metrics.lcp} unit="s" target={2500} />
          <CWVPill label="TBT" value={result.metrics.tbt} unit="ms" target={200} />
          <CWVPill label="CLS" value={result.metrics.cls} unit="" target={0.1} />
          <CWVPill label="FCP" value={result.metrics.fcp} unit="s" target={1800} />
          <CWVPill label="SI"  value={result.metrics.si}  unit="s" target={3400} />
        </div>
      )}

      {/* Issues toggle */}
      {result && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ width: '100%', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}
          >
            <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
            {result.issues?.length === 0
              ? 'No static issues'
              : `${result.issues?.length ?? 0} static issue${(result.issues?.length ?? 0) !== 1 ? 's' : ''}`}
            {result.issues && result.issues.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 11, padding: '1px 7px', borderRadius: 10, background: SCORE_BG(result.score), color: SCORE_COLOR(result.score), border: `1px solid ${SCORE_BORDER(result.score)}`, fontWeight: 600 }}>
                {SCORE_LABEL(result.score)} · {result.score}/100
              </span>
            )}
            {result.audits && result.audits.length > 0 && (
              <span style={{ fontSize: 11, color: '#D97706', padding: '1px 7px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', fontWeight: 600 }}>
                +{result.audits.length} Lighthouse audit{result.audits.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>
          {expanded && (
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.issues && <IssueList issues={result.issues} />}
              {result.audits && result.audits.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Lighthouse Audits</div>
                  {result.audits.slice(0, 10).map(a => (
                    <div key={a.name} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: SCORE_COLOR(a.score), flexShrink: 0, width: 28 }}>{a.score}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Lighthouse() {
  const toast = useToast();
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [results, setResults] = useState<Record<string, StaticAudit>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, BatchResult>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const loadResults = useCallback(() => {
    fetch('/api/lighthouse')
      .then(r => r.json())
      .then((data: StaticAudit[]) => {
        const map: Record<string, StaticAudit> = {};
        for (const d of data) if (d.appId && d.score !== null) map[d.appId] = d;
        setResults(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/apps').then(r => r.json()).then(setApps).catch(() => {});
    loadResults();
  }, [loadResults]);

  async function runStatic(appId: string) {
    setRunning(appId);
    try {
      const res = await fetch('/api/lighthouse/static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error('Audit failed', data.error); return; }
      setResults(r => ({ ...r, [appId]: data }));
      const label = data.score >= 90 ? 'All good' : `${data.issues.length} issue(s) found`;
      toast.success(`${appId.toUpperCase()} static audit done`, `Score ${data.score}/100 · ${label}`);
    } catch (e) {
      toast.error('Network error', String(e));
    } finally {
      setRunning(null);
    }
  }

  async function runLive(appId: string, url: string) {
    setRunning(appId);
    toast.info(`Auditing ${url}…`, 'Checking preview server first…');
    try {
      const res = await fetch('/api/lighthouse/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, url }),
      });
      const data = await res.json();
      if (res.status === 503) {
        toast.error(`${appId.toUpperCase()} preview not running`, data.error);
        return;
      }
      if (res.status === 422) {
        toast.error(`${appId.toUpperCase()} page didn't render`, data.error);
        return;
      }
      if (!res.ok) { toast.error('Live audit failed', data.error); return; }
      setResults(r => ({ ...r, [appId]: data }));
      toast.success(`${appId.toUpperCase()} live audit done`, `Performance ${data.metrics?.performance ?? '?'}/100`);
    } catch (e) {
      toast.error('Live audit error', String(e));
    } finally {
      setRunning(null);
    }
  }

  async function auditAll() {
    for (const app of apps) await runStatic(app.id);
  }

  function handleLiveAudit(appId: string, url: string) {
    runLive(appId, url);
  }

  function handleSelectionChange(appId: string, urls: string[]) {
    setSelections(s => ({ ...s, [appId]: urls }));
  }

  const allSelected = Object.values(selections).flat();
  const totalSelected = allSelected.length;

  async function runBatch() {
    if (totalSelected === 0) return;
    setBatchRunning(true);
    const targets = allSelected.map(url => {
      const appId = apps.find(a => a.port && url.includes(`:${a.port}`))?.id ?? 'unknown';
      return { appId, url };
    });
    try {
      const res = await fetch('/api/lighthouse/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error('Batch audit failed', data.error); return; }
      const map: Record<string, BatchResult> = {};
      for (const r of data.results) map[r.url] = r;
      setBatchResults(map);
      toast.success(
        `Batch done — ${data.passed}/${data.total} passed`,
        `${totalSelected} routes audited in parallel`
      );
    } catch (e) {
      toast.error('Batch error', String(e));
    } finally {
      setBatchRunning(false);
    }
  }

  const audited = Object.keys(results).length;
  const avgScore = audited > 0
    ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / audited)
    : null;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Lighthouse Audit</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>
            Static HTML audit runs instantly on dist/ · Live audit requires Chrome + a running preview server
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {avgScore !== null && (
            <div style={{ padding: '6px 14px', borderRadius: 8, background: SCORE_BG(avgScore), border: `1px solid ${SCORE_BORDER(avgScore)}`, color: SCORE_COLOR(avgScore), fontSize: 13, fontWeight: 700 }}>
              Avg {avgScore}/100
            </div>
          )}
          <button
            onClick={auditAll}
            disabled={!!running || !!batchRunning || apps.length === 0}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: (running || batchRunning) ? 'var(--border)' : 'var(--surface)', color: (running || batchRunning) ? 'var(--muted)' : 'var(--text)', border: '1.5px solid var(--border)', cursor: (running || batchRunning) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)' }}
          >
            ⚡ Static All
          </button>
          <button
            onClick={runBatch}
            disabled={totalSelected === 0 || batchRunning || !!running}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: (batchRunning || totalSelected === 0) ? 'var(--border)' : 'linear-gradient(135deg, #1428A0 0%, #3B5BDB 100%)', color: (batchRunning || totalSelected === 0) ? 'var(--muted)' : 'white', border: 'none', cursor: (batchRunning || totalSelected === 0) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {batchRunning && <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {batchRunning ? 'Running…' : `🔦 Batch Audit${totalSelected > 0 ? ` (${totalSelected})` : ''}`}
          </button>
        </div>
      </div>

      {/* What each type does */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '⚡', title: 'Static Audit', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', items: ['Scans dist/index.html — no server needed', 'Checks title, viewport, lang, meta desc', 'Flags inline scripts, missing alt text, favicon', 'Score 0–100 — run after every build'] },
          { icon: '🔦', title: 'Live Audit', color: '#1428A0', bg: 'var(--signal-soft)', border: '#C7D2FE', items: ['Full Lighthouse via headless Chrome', 'Performance, A11y, Best Practices, SEO scores', 'Core Web Vitals: LCP, TBT, CLS, FCP, SI', 'Audits root URL only — not individual routes', 'Requires preview server running (pnpm dev starts these)'] },
        ].map(({ icon, title, color, bg, border, items }) => (
          <div key={title} style={{ padding: '14px 16px', borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{icon} {title}</div>
            {items.map(item => (
              <div key={item} style={{ display: 'flex', gap: 7, fontSize: 12, color, marginBottom: 3, opacity: 0.85 }}>
                <span style={{ flexShrink: 0 }}>·</span>{item}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Plugin cards */}
      {apps.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No plugins registered</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
          {apps.map(app => (
            <PluginCard
              key={app.id}
              app={app}
              result={results[app.id] ?? null}
              batchResults={batchResults}
              onStaticAudit={runStatic}
              onLiveAudit={handleLiveAudit}
              onSelectionChange={handleSelectionChange}
              running={running === app.id || batchRunning}
            />
          ))}
        </div>
      )}
    </div>
  );
}
