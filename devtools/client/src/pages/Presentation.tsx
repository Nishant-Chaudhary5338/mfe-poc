import { useState, useEffect, useCallback } from 'react';

interface Props { onExit: () => void; }

// ─── Slides ───────────────────────────────────────────────────────────────────

function Slide1() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 4 + 2, height: Math.random() * 4 + 2,
          borderRadius: '50%',
          background: i % 2 === 0 ? '#1428A0' : '#F4511E',
          left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
          opacity: 0.3 + (i % 3) * 0.15,
          animation: `float${i % 3} ${3 + (i % 4)}s ease-in-out infinite alternate`,
        }} />
      ))}
      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 820 }}>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: 68, fontWeight: 800, lineHeight: 1.05,
          margin: '0 0 24px',
          background: 'linear-gradient(135deg, #F7F8FC 0%, #AAB5F7 50%, #FC6A47 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Plugin-Based<br />Micro-Frontends<br />+ Monorepo
        </h1>
        <p style={{ fontSize: 22, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 48px', fontWeight: 400 }}>
          Ship faster. Own your stack. Scale without chaos.
        </p>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>PRESS → TO BEGIN</div>
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F4511E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>The Problem</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Every frontend team<br />hits the same wall.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { icon: '🔗', title: 'Deploy together, risk together', desc: 'One runtime error in any part of the codebase brings down the entire platform. Every team pays the price.' },
          { icon: '⏱', title: 'Cross-team coordination tax', desc: 'A shared UI change needs synced PRs, multiple review cycles, and a release window everyone agrees on.' },
          { icon: '💥', title: 'The slowest team sets the pace', desc: 'No team can ship independently. The release cadence is defined by whoever is blocked.' },
        ].map(item => (
          <div key={item.title} style={{
            background: 'var(--card)', borderRadius: 16, padding: 28,
            border: '1px solid var(--border)', borderTop: '3px solid #F4511E',
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide3() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>The Concept</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Your app. Your deploy.<br />Your timeline.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { icon: '🧩', text: 'Each team builds and deploys their app completely independently' },
            { icon: '🔌', text: 'The shell knows WHERE to load plugins — not how they were built' },
            { icon: '🛡', text: 'No shared build. No shared deploy. No shared blast radius.' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{b.icon}</div>
              <div style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.6 }}>{b.text}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(20,40,160,0.08)', border: '2px solid rgba(20,40,160,0.3)', borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Shell (host app)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Plugin A', color: '#1428A0' },
              { label: 'Plugin B', color: '#F4511E' },
              { label: 'Plugin C', color: '#546BE8' },
            ].map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 16px',
                border: `1.5px solid ${p.color}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 11, color: '#AAB5F7', fontFamily: 'var(--font-mono)' }}>loaded at runtime</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Each plugin: its own repo, its own build, its own deploy.
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide4() {
  type Zone = 'vite' | 'registry' | null;
  const [active, setActive] = useState<Zone>(null);

  const callouts: Record<string, string> = {
    vite: '@originjs/vite-plugin-federation compiles each plugin into a remoteEntry.js — a module manifest that exposes your app\'s public surface. The shell fetches and mounts it at runtime without knowing anything about how it was built.',
    registry: 'registry.json maps plugin IDs to their remoteEntry.js URLs. The shell reads this on startup. Swap a URL here and the new version is live on next load — zero rebuild of the shell, instant rollback by reverting the URL.',
  };

  const viteLines = [
    [{ t: '// vite.config.ts — inside each plugin', c: 'var(--muted)' }],
    [{ t: 'federation', c: '#FC6A47' }, { t: '({', c: '#F7F8FC' }],
    [{ t: '  name', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: "'analytics'", c: '#4ade80' }, { t: ',', c: '#F7F8FC' }],
    [{ t: '  filename', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: "'remoteEntry.js'", c: '#4ade80' }, { t: ',', c: '#F7F8FC' }],
    [{ t: '  exposes', c: '#AAB5F7' }, { t: ': { ', c: '#F7F8FC' }, { t: "'./App'", c: '#4ade80' }, { t: ': ', c: '#F7F8FC' }, { t: "'./src/App.tsx'", c: '#4ade80' }, { t: ' },', c: '#F7F8FC' }],
    [{ t: '  shared', c: '#AAB5F7' }, { t: ': {', c: '#F7F8FC' }],
    [{ t: '    react', c: '#AAB5F7' }, { t: ': { ', c: '#F7F8FC' }, { t: 'singleton', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: 'true', c: '#FC6A47' }, { t: ' },', c: '#F7F8FC' }],
    [{ t: '  },', c: '#F7F8FC' }],
    [{ t: '})', c: '#F7F8FC' }],
  ];

  const regLines = [
    [{ t: '[', c: '#F7F8FC' }],
    [{ t: '  { ', c: '#F7F8FC' }, { t: '"id"', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: '"analytics"', c: '#4ade80' }, { t: ',', c: '#F7F8FC' }],
    [{ t: '    ', c: '#F7F8FC' }, { t: '"url"', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: '"https://cdn.co/v2/remoteEntry.js"', c: '#4ade80' }, { t: ' },', c: '#F7F8FC' }],
    [{ t: '  { ', c: '#F7F8FC' }, { t: '"id"', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: '"monitoring"', c: '#4ade80' }, { t: ',', c: '#F7F8FC' }],
    [{ t: '    ', c: '#F7F8FC' }, { t: '"url"', c: '#AAB5F7' }, { t: ': ', c: '#F7F8FC' }, { t: '"https://cdn.co/v1/remoteEntry.js"', c: '#4ade80' }, { t: ' },', c: '#F7F8FC' }],
    [{ t: ']', c: '#F7F8FC' }],
  ];

  const terminal = (label: string, zone: Zone, lines: { t: string; c: string }[][], footer: string, footerColor: string) => (
    <div
      onClick={() => setActive(active === zone ? null : zone)}
      style={{
        background: '#050810', borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        border: active === zone ? `1px solid ${footerColor}80` : '1px solid var(--border)',
        boxShadow: active === zone ? `0 0 24px ${footerColor}20` : 'none',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#f87171', '#fbbf24', '#4ade80'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: active === zone ? footerColor : 'var(--muted)' }}>{label}</span>
      </div>
      <div style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.85 }}>
        {lines.map((line, i) => (
          <div key={i}>{line.map((tok, j) => <span key={j} style={{ color: tok.c }}>{tok.t}</span>)}</div>
        ))}
      </div>
      <div style={{ padding: '8px 18px 12px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: footerColor }}>{footer}</span>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>How It Works</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 42, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Runtime composition, not build-time coupling.
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Click either block for details.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
        {terminal('vite.config.ts · inside each plugin', 'vite', viteLines, '@originjs/vite-plugin-federation', '#fbbf24')}
        {terminal('registry.json · served by DevTools API', 'registry', regLines, 'Shell reads this on startup · URL swap = instant deploy', '#4ade80')}
      </div>
      <div style={{
        padding: '14px 22px', borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(20,40,160,0.12), rgba(244,81,30,0.12))',
        border: '1px solid rgba(255,255,255,0.06)', minHeight: 50, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <p style={{ fontSize: 13, color: active ? 'var(--text)' : 'var(--muted)', margin: 0, lineHeight: 1.65, flex: 1, fontFamily: active ? 'var(--font-body)' : 'var(--font-body)' }}>
          {active ? callouts[active] : 'Change a URL in registry.json → new plugin version live on next page load. Zero rebuild of the shell required.'}
        </p>
        {active && (
          <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: '0 4px' }}>×</button>
        )}
      </div>
    </div>
  );
}

function Slide5() {
  const [showSplit, setShowSplit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowSplit(true), 600);
    return () => clearTimeout(t);
  }, []);

  const codeLines = [
    [{ t: '// Each route is a separate bundle — fetched only when visited', c: 'var(--muted)' }],
    [{ t: 'const ', c: '#AAB5F7' }, { t: 'Dashboard', c: '#FC6A47' }, { t: ' = ', c: '#F7F8FC' }, { t: 'lazy', c: '#AAB5F7' }, { t: "(() => import('./routes/Dashboard'))", c: '#4ade80' }],
    [{ t: 'const ', c: '#AAB5F7' }, { t: 'Reports  ', c: '#FC6A47' }, { t: ' = ', c: '#F7F8FC' }, { t: 'lazy', c: '#AAB5F7' }, { t: "(() => import('./routes/Reports'))", c: '#4ade80' }],
    [{ t: 'const ', c: '#AAB5F7' }, { t: 'Settings ', c: '#FC6A47' }, { t: ' = ', c: '#F7F8FC' }, { t: 'lazy', c: '#AAB5F7' }, { t: "(() => import('./routes/Settings'))", c: '#4ade80' }],
    [{ t: '', c: '' }],
    [{ t: '<', c: '#F7F8FC' }, { t: 'Suspense', c: '#fbbf24' }, { t: ' fallback={<', c: '#F7F8FC' }, { t: 'PageSkeleton', c: '#FC6A47' }, { t: ' />}>', c: '#F7F8FC' }],
    [{ t: '  <', c: '#F7F8FC' }, { t: 'Routes', c: '#fbbf24' }, { t: '>', c: '#F7F8FC' }],
    [{ t: '    <', c: '#F7F8FC' }, { t: 'Route', c: '#fbbf24' }, { t: ' path=', c: '#F7F8FC' }, { t: '"/"', c: '#4ade80' }, { t: '        element={<', c: '#F7F8FC' }, { t: 'Dashboard', c: '#FC6A47' }, { t: ' />} />', c: '#F7F8FC' }],
    [{ t: '    <', c: '#F7F8FC' }, { t: 'Route', c: '#fbbf24' }, { t: ' path=', c: '#F7F8FC' }, { t: '"/reports"', c: '#4ade80' }, { t: '  element={<', c: '#F7F8FC' }, { t: 'Reports', c: '#FC6A47' }, { t: '   />} />', c: '#F7F8FC' }],
    [{ t: '    <', c: '#F7F8FC' }, { t: 'Route', c: '#fbbf24' }, { t: ' path=', c: '#F7F8FC' }, { t: '"/settings"', c: '#4ade80' }, { t: ' element={<', c: '#F7F8FC' }, { t: 'Settings', c: '#FC6A47' }, { t: '  />} />', c: '#F7F8FC' }],
    [{ t: '  </', c: '#F7F8FC' }, { t: 'Routes', c: '#fbbf24' }, { t: '>', c: '#F7F8FC' }],
    [{ t: '</', c: '#F7F8FC' }, { t: 'Suspense', c: '#fbbf24' }, { t: '>', c: '#F7F8FC' }],
  ];

  const chunks = [
    { label: 'Dashboard chunk', color: '#546BE8' },
    { label: 'Reports chunk', color: '#F4511E' },
    { label: 'Settings chunk', color: '#fbbf24' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Code Splitting</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Only load what the user actually visits.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24 }}>
        {/* Code block */}
        <div style={{ background: '#050810', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#f87171', '#fbbf24', '#4ade80'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>routes.tsx — inside any plugin</span>
          </div>
          <div style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.9 }}>
            {codeLines.map((line, i) => (
              <div key={i}>{line.map((tok, j) => tok.t ? <span key={j} style={{ color: tok.c }}>{tok.t}</span> : <span key={j}>&nbsp;</span>)}</div>
            ))}
          </div>
        </div>

        {/* Before / after */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 8 }}>Without splitting</div>
            <div style={{ height: 32, borderRadius: 6, background: 'rgba(244,81,30,0.55)', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>entire plugin on first load (~380KB)</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 8 }}>With splitting</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 28, borderRadius: 6, background: 'rgba(20,40,160,0.65)', width: '25%', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ fontSize: 10, color: '#AAB5F7', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>shell ~40KB</span>
              </div>
              {chunks.map((ch, i) => (
                <div key={i} style={{
                  height: 26, borderRadius: 6,
                  background: ch.color + '45', border: `1px solid ${ch.color}55`,
                  width: showSplit ? '70%' : '0%',
                  display: 'flex', alignItems: 'center', paddingLeft: 10,
                  transition: `width 480ms ease ${180 + i * 110}ms`,
                  overflow: 'hidden',
                }}>
                  <span style={{ fontSize: 10, color: ch.color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{ch.label} — on demand</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { value: '~40KB', label: 'Initial load' },
              { value: 'on demand', label: 'Per-route' },
              { value: 'per-chunk', label: 'CDN cache' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', borderRadius: 10, padding: '10px 10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 800, color: '#AAB5F7' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide6() {
  const benefits = [
    { title: 'Shared UI Package', desc: 'One change to @repo/shared-ui propagates to every plugin instantly. No duplicate components, no drift.', color: '#1428A0' },
    { title: 'Standardised Tooling', desc: 'Same Vite config, TypeScript base, ESLint rules across every team. No snowflake setups to maintain.', color: '#546BE8' },
    { title: 'Unified Testing', desc: 'Shared test utilities in packages/. Every plugin inherits them. Consistent coverage patterns, no divergence.', color: '#4ade80' },
    { title: 'Single CI/CD Pipeline', desc: 'One pipeline builds, tests, and deploys all plugins. Coordinated releases with zero extra configuration.', color: '#F4511E' },
  ];

  const tree = [
    { depth: 0, name: 'monorepo/', color: '#AAB5F7' },
    { depth: 1, name: 'apps/', color: '#AAB5F7' },
    { depth: 2, name: 'shell/          ← host', color: '#8C94B0' },
    { depth: 2, name: 'team-a/ · team-b/ · team-c/', color: '#8C94B0' },
    { depth: 1, name: 'packages/', color: '#AAB5F7' },
    { depth: 2, name: 'shared-ui/   ← @repo/shared-ui', color: '#4ade80' },
    { depth: 1, name: 'devtools/', color: '#AAB5F7' },
    { depth: 2, name: 'server.js · client/', color: '#8C94B0' },
    { depth: 1, name: '.clinerules/    ← AI context', color: '#fbbf24' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Monorepo</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 48, fontWeight: 800, lineHeight: 1.1, margin: '0 0 12px', color: 'var(--text)' }}>
          One repo. Every team. Zero silos.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--muted)', margin: 0 }}>Shared code lives once. Every plugin uses it. No drift, no duplication.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
        <div style={{ background: '#050810', borderRadius: 14, padding: '20px 22px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 2.1 }}>
          {tree.map((node, i) => (
            <div key={i} style={{ paddingLeft: node.depth * 18, color: node.color }}>
              {node.depth > 0 ? '├─ ' : ''}{node.name}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {benefits.map(b => (
            <div key={b.title} style={{
              background: 'var(--card)', borderRadius: 12, padding: '14px 18px',
              border: '1px solid var(--border)', borderLeft: `4px solid ${b.color}`,
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide7() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Live Demo</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>See it running.</h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 8 }}>Navigate between plugins — each loads independently. No page reload.</p>
      </div>
      <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface)', maxHeight: 420 }}>
        <iframe src="http://localhost:3000" style={{ width: '100%', height: '100%', border: 'none' }} title="Platform Shell" />
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
        Platform Shell · Plugins served independently from their own origins
      </p>
    </div>
  );
}

function Slide8() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Zero Downtime</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Deploy one plugin.<br />Others don't notice.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Before — Monolith</div>
          {[
            'Update a feature in the shared codebase',
            'Run the full platform test suite (~18 min)',
            'Build the entire platform (~8 min)',
            'Deploy everything',
            'Hope nothing else broke',
          ].map((s, i) => (
            <div key={s} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{s}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#f87171' }}>~26 minutes · Full platform risk</div>
        </div>
        <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>After — Plugin MFE</div>
          {[
            'Update your plugin only',
            'Build your plugin (~45 seconds)',
            'Push bundle to versioned CDN path',
            'Update the URL in registry.json',
            'Instant rollback: revert the URL',
          ].map((s, i) => (
            <div key={s} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{s}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#4ade80' }}>~45 seconds · Zero risk to others</div>
        </div>
      </div>
    </div>
  );
}

function Slide9() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>DevTools</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          From idea to running plugin in 60 seconds.
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 8 }}>No boilerplate. No manual wiring. Fill a form, click create.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16 }}>You provide</div>
          {[
            { label: 'App ID', value: 'analytics' },
            { label: 'Label', value: 'Analytics Dashboard' },
            { label: 'Port', value: '3005' },
            { label: 'Color', value: '#7c3aed' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 7, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#AAB5F7' }}>{f.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 16 }}>DevTools generates</div>
          {[
            'apps/analytics/package.json',
            'apps/analytics/vite.config.ts',
            'apps/analytics/tsconfig.json',
            'apps/analytics/index.html',
            'apps/analytics/src/main.tsx',
            'apps/analytics/src/App.tsx',
            'apps/analytics/src/routes/*.tsx',
            '↓ registry.json updated automatically',
          ].map((f, i) => (
            <div key={f} style={{
              padding: '5px 10px', borderRadius: 6, marginBottom: 6,
              background: i === 7 ? 'rgba(20,40,160,0.1)' : 'var(--surface)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: i === 7 ? '#AAB5F7' : '#4ade80',
            }}>{i < 7 ? '+ ' : ''}{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide10() {
  const chunks = [
    { name: 'react-B9NMl48p.js', type: 'unchanged', size: '15.7 kB' },
    { name: 'react-dom-BRGPy-Q5.js', type: 'unchanged', size: '6.7 kB' },
    { name: 'Drafts-gh_MZpgh.js', type: 'added', size: '1.6 kB' },
    { name: 'App-BMsdPfV9.js', type: 'modified', size: '4.0 kB' },
    { name: 'App-DycX3Nsi.js', type: 'deleted', size: '3.8 kB' },
    { name: 'shared-ui-BMQPQCFZ.js', type: 'unchanged', size: '2.1 kB' },
  ];
  const colors = { unchanged: '#4A5170', added: '#4ade80', modified: '#fbbf24', deleted: '#f87171' };
  const icons = { unchanged: '✅', added: '🆕', modified: '✏️', deleted: '❌' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Build Intelligence</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Know exactly what shipped.
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 8 }}>Every build is snapshotted. Chunk-level diff shows what changed — CDN invalidation only hits those chunks.</p>
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20 }}>
          {[{ label: '3 unchanged', color: '#4A5170' }, { label: '1 added', color: '#4ade80' }, { label: '1 modified', color: '#fbbf24' }, { label: '1 deleted', color: '#f87171' }].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 13, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
        {chunks.map((c, i) => (
          <div key={c.name} style={{
            padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: i < chunks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: c.type === 'added' ? 'rgba(74,222,128,0.03)' : c.type === 'deleted' ? 'rgba(248,113,113,0.03)' : 'transparent',
          }}>
            <span style={{ fontSize: 18, width: 28, flexShrink: 0 }}>{icons[c.type as keyof typeof icons]}</span>
            <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: (colors as Record<string, string>)[c.type] }}>{c.name}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{c.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide11() {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  const impacts = [
    { title: 'Instant Context', desc: 'Any AI agent reads .clinerules → knows how to create, register, and style a plugin in one pass', color: '#AAB5F7' },
    { title: 'Less Token Usage', desc: 'Shared patterns mean correct code on the first try — no back-and-forth rounds of correction', color: '#4ade80' },
    { title: 'Better Code Reuse', desc: 'AI sees @repo/shared-ui → uses existing components instead of reinventing them', color: '#fbbf24' },
    { title: '60-Second Plugins', desc: 'One conversation with an AI agent = new plugin scaffolded, registered, and running', color: '#F4511E' },
  ];

  const rulesPreview = [
    '# Plugin-Based MFE — AI Context',
    '',
    'Repo type: pnpm monorepo',
    'apps/ · packages/ · devtools/',
    '',
    'New plugin → follow apps/team-a pattern',
    'Register → devtools/data/registry.json',
    'Shared UI → @repo/shared-ui',
    'Design tokens documented in .clinerules',
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB5F7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>AI-Native</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: '0 0 12px', color: 'var(--text)' }}>
          AI that understands your repo from line one.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', margin: 0 }}>
          <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 5, color: '#fbbf24' }}>.clinerules/</code>
          {' '}at root = zero onboarding for Claude, Cursor, Cline, or any agentic tool.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24 }}>
        <div style={{ background: '#050810', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#f87171', '#fbbf24', '#4ade80'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>.clinerules/project.md</span>
          </div>
          <div style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.9 }}>
            {rulesPreview.map((line, i) => (
              <div key={i} style={{ color: line.startsWith('#') ? '#AAB5F7' : (line.startsWith('Repo') || line.startsWith('New') || line.startsWith('Register') || line.startsWith('Shared') || line.startsWith('Design')) ? '#4ade80' : 'var(--muted)' }}>
                {line || '\u00A0'}
              </div>
            ))}
            <span style={{ color: '#F4511E', opacity: blink ? 1 : 0 }}>▋</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {impacts.map(c => (
            <div key={c.title} style={{ background: 'var(--card)', borderRadius: 12, padding: '13px 16px', border: '1px solid var(--border)', borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide12() {
  const companies = [
    { name: 'Netflix', desc: 'MFE at streaming scale' },
    { name: 'DAZN', desc: 'Live sports, independent teams' },
    { name: 'Zalando', desc: 'E-commerce plugin modules' },
    { name: 'Spotify', desc: 'Distributed frontend org' },
  ];

  const stats = [
    { value: '60s', label: 'Scaffold a new plugin', color: '#4ade80' },
    { value: '~45s', label: 'Plugin build + deploy', color: '#AAB5F7' },
    { value: '0', label: 'Cross-team blockers', color: '#F4511E' },
    { value: '1', label: 'Repo, all teams', color: '#fbbf24' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Proven at Scale</div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
          Not theoretical. Running in production,<br />elsewhere and here.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {companies.map(c => (
          <div key={c.name} style={{ background: 'var(--card)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)', borderLeft: '4px solid #4ade80' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--card)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)', borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, rgba(20,40,160,0.15), rgba(244,81,30,0.15))', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>
          "Our proof of concept is running right now — full shell, independent plugins, DevTools. This isn't a proposal. It's working software."
        </div>
      </div>
    </div>
  );
}

function Slide13() {
  const cards = [
    { icon: '🙋', head: 'One team, one feature', sub: '2–3 weeks. Pilot. Low risk.' },
    { icon: '⚡', head: 'Everything is ready', sub: 'Scaffold, devtools, registry — live now.' },
    { icon: '🛡', head: 'Isolated from day one', sub: 'Your plugin deploys independently.' },
  ];

  const stats = [
    { value: '60s', label: 'Plugin scaffolded' },
    { value: '~45s', label: 'Deploy time' },
    { value: '0', label: 'Coordination overhead' },
    { value: '∞', label: 'Teams can scale to' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F4511E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>The Ask</div>
        <h2 style={{
          fontFamily: 'var(--font-head)', fontSize: 54, fontWeight: 900, lineHeight: 1.05, margin: 0,
          background: 'linear-gradient(135deg, #F7F8FC 0%, #AAB5F7 50%, #FC6A47 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Let's make this<br />the way we build.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {cards.map(c => (
          <div key={c.head} style={{ background: 'var(--card)', borderRadius: 14, padding: '20px 18px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{c.head}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 900, color: '#AAB5F7', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '18px 28px', background: 'linear-gradient(135deg, rgba(20,40,160,0.15), rgba(244,81,30,0.15))', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800,
          background: 'linear-gradient(135deg, #AAB5F7, #FC6A47)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          The infrastructure is ready. The demo is live. Let's talk.
        </div>
      </div>
    </div>
  );
}

// ─── Slide registry ───────────────────────────────────────────────────────────

const SLIDES = [
  { id: 1,  title: 'Title',            component: <Slide1 /> },
  { id: 2,  title: 'The Problem',      component: <Slide2 /> },
  { id: 3,  title: 'The Concept',      component: <Slide3 /> },
  { id: 4,  title: 'How It Works',     component: <Slide4 /> },
  { id: 5,  title: 'Code Splitting',   component: <Slide5 /> },
  { id: 6,  title: 'Monorepo',         component: <Slide6 /> },
  { id: 7,  title: 'Live Demo',        component: <Slide7 /> },
  { id: 8,  title: 'Zero Downtime',    component: <Slide8 /> },
  { id: 9,  title: 'DevTools',         component: <Slide9 /> },
  { id: 10, title: 'Build Intelligence', component: <Slide10 /> },
  { id: 11, title: 'AI-Native',        component: <Slide11 /> },
  { id: 12, title: 'Proven at Scale',  component: <Slide12 /> },
  { id: 13, title: 'The Ask',          component: <Slide13 /> },
];

// ─── Main shell ───────────────────────────────────────────────────────────────

export default function Presentation({ onExit }: Props) {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onExit]);

  const progress = ((current + 1) / total) * 100;

  return (
    <>
      <style>{`
        @keyframes float0 { from { transform: translateY(0px); } to { transform: translateY(-12px); } }
        @keyframes float1 { from { transform: translateY(0px) translateX(0px); } to { transform: translateY(8px) translateX(-6px); } }
        @keyframes float2 { from { transform: translateY(0px); } to { transform: translateY(14px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-body)', zIndex: 9999,
      }}>
        <div style={{ height: 3, background: 'var(--surface)', position: 'relative', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #1428A0, #F4511E)', transition: 'width 300ms ease' }} />
        </div>

        <div style={{ flex: 1, padding: '48px 64px', overflow: 'hidden' }}>
          {SLIDES[current].component}
        </div>

        <div style={{
          flexShrink: 0, padding: '16px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid var(--border)', background: 'rgba(13,16,32,0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Plugin-Based MFE</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Monorepo</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: i === current ? 20 : 8, height: 8, borderRadius: 4,
                background: i === current ? '#AAB5F7' : 'var(--border)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 200ms ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{current + 1} / {total}</span>
            <button onClick={prev} disabled={current === 0} style={{
              width: 36, height: 36, borderRadius: 8,
              background: current === 0 ? 'var(--surface)' : 'var(--card)',
              border: '1px solid var(--border)', color: current === 0 ? 'var(--border)' : 'var(--text)',
              cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: 16,
            }}>←</button>
            <button onClick={next} disabled={current === total - 1} style={{
              width: 36, height: 36, borderRadius: 8,
              background: current === total - 1 ? 'var(--surface)' : '#1428A0',
              border: 'none', color: current === total - 1 ? 'var(--border)' : 'white',
              cursor: current === total - 1 ? 'not-allowed' : 'pointer', fontSize: 16,
            }}>→</button>
            <button onClick={onExit} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--surface)', color: 'var(--muted)',
              border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Exit</button>
          </div>
        </div>
      </div>
    </>
  );
}
