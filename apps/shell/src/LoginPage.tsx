import { useState, type CSSProperties } from 'react';
import { useAuth } from '@repo/auth';
import { MOCK_USERS } from '@repo/auth';

const rolePlugins: Record<string, string> = {
  admin:  'SMS · QCA · CMS · MAM',
  ops:    'SMS · QCA',
  editor: 'CMS · MAM',
  viewer: 'SMS · QCA · CMS · MAM',
};

const roleColors: Record<string, string> = {
  admin: '#1428A0', ops: '#059669', editor: '#F4511E', viewer: '#4A5170',
};

const roleIcons: Record<string, string> = {
  admin: '👑', ops: '⚙️', editor: '✏️', viewer: '👁️',
};

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedId, setSelectedId] = useState(MOCK_USERS[0].id);
  const selectedUser = MOCK_USERS.find(u => u.id === selectedId)!;
  const roleColor = roleColors[selectedUser.role];

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* Left panel — dark diagonal */}
      <div className="relative flex basis-[62%] shrink-0 flex-col justify-center overflow-hidden py-12 pl-14 pr-20 [clip-path:polygon(0_0,100%_0,85%_100%,0_100%)] bg-gradient-to-[150deg] from-[#070910] via-[#0d1433] to-[#1428A0]/[0.08]"
        style={{ background: 'linear-gradient(150deg, #070910 0%, #0d1433 60%, #1428A015 100%)' }}
      >
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-[10%] right-[5%] size-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, #1428A018 0%, transparent 65%)' }}
        />

        {/* Logo */}
        <div className="mb-11 flex items-center gap-3.5">
          <div className="flex size-[52px] flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1428A0] to-[#091455] shadow-[0_8px_24px_#1428A050]">
            <span className="text-[26px]">📺</span>
          </div>
          <div>
            <div className="font-[Sora] text-[22px] font-extrabold tracking-tight text-white">
              TV<span className="text-[#F4511E]">Plus</span> Portal
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-widest text-white/35">
              Enterprise Plugin Platform
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="mb-3.5 font-[Sora] text-[38px] font-extrabold leading-[1.15] tracking-tighter text-white">
          One portal.<br />
          <span className="bg-gradient-to-r from-[#546BE8] to-[#93b4ff] bg-clip-text text-transparent">
            Every team.
          </span>
        </div>
        <p className="mb-12 max-w-[360px] text-sm leading-7 text-white/40">
          Role-based access to independently deployed micro-frontends.
          Each team owns their plugin — zero coordination required.
        </p>

        {/* Role matrix */}
        <div>
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
            Role access matrix
          </div>
          <div className="flex flex-col gap-[7px]">
            {MOCK_USERS.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-2.5 rounded-[9px] border border-white/[0.07] bg-white/[0.04] px-[13px] py-[9px]"
              >
                <span className="w-[18px] text-center text-[13px]">{roleIcons[u.role]}</span>
                <span className="min-w-[100px] text-xs font-semibold text-white/70">{u.name}</span>
                <span
                  className="mr-1 rounded-full px-[7px] py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: roleColors[u.role] + '28', color: roleColors[u.role] }}
                >
                  {u.role}
                </span>
                <span className="ml-auto text-[11px] text-white/[0.28]">{rolePlugins[u.role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="-ml-[3%] z-10 flex flex-1 items-center justify-center bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.22)]">
        <div className="w-full max-w-[340px] px-11">

          {/* Header */}
          <div className="mb-7">
            <div className="mb-1.5 font-[Sora] text-[26px] font-extrabold tracking-tight text-slate-900">
              Welcome back
            </div>
            <div className="text-sm text-slate-500">Sign in to your workspace</div>
          </div>

          {/* Account select */}
          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Account</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full appearance-none cursor-pointer rounded-[9px] border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-[11px] pr-9 text-sm text-slate-900 outline-none focus:border-[#1428A0] transition-colors"
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">▾</span>
            </div>
          </div>

          {/* Password */}
          <div className="mb-2.5">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Password</label>
            <input
              type="password"
              defaultValue="demo1234"
              readOnly
              className="w-full cursor-default rounded-[9px] border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-[11px] text-sm text-slate-300 outline-none"
            />
          </div>

          {/* Access preview */}
          <div
            style={{ '--role-color': roleColor, background: roleColor + '0C', border: `1px solid ${roleColor}22` } as CSSProperties}
            className="mb-[22px] flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <span className="text-sm">{roleIcons[selectedUser.role]}</span>
            <span className="text-xs text-slate-600">
              You'll see: <strong style={{ color: roleColor }}>{rolePlugins[selectedUser.role]}</strong>
            </span>
          </div>

          {/* Sign In button */}
          <button
            onClick={() => login(selectedId)}
            className="w-full cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-[#1428A0] to-[#1e3fc2] py-[13px] font-[Sora] text-[15px] font-bold text-white shadow-[0_4px_14px_#1428A038] transition-opacity duration-150 hover:opacity-90"
          >
            Sign In
          </button>

          {/* Footer */}
          <div className="mt-[18px] flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span>🔒</span>
            <span>Mock SSO · Demo mode · No password required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
