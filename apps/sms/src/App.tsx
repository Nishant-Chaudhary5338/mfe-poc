import { lazy, Suspense, useCallback } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Skeleton } from '@repo/ui';
import { store, useAppSelector, useAppDispatch } from './store/index';
import { logout } from './store/authSlice';

const COLOR      = '#1428A0';
const COLOR_DARK = '#091455';

const Login     = lazy(() => import('./routes/Login.tsx'));
const Dashboard = lazy(() => import('./routes/Dashboard.tsx'));

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', end: true },
];

function AppShell() {
  const dispatch = useAppDispatch();
  const token    = useAppSelector(s => s.auth.token);
  const user     = useAppSelector(s => s.auth.user);

  // Logout of this app AND go back to portal
  const handleGoPortal = useCallback(() => {
    dispatch(logout());
    (globalThis as any).__tvplus_goHome?.();
  }, [dispatch]);

  if (!token) return (
    <Suspense fallback={<FullPageLoader />}>
      <Login onGoPortal={handleGoPortal} />
    </Suspense>
  );

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden font-sans">
        <nav className="flex w-[220px] shrink-0 flex-col overflow-hidden" style={{ background: COLOR_DARK }}>
          <div className="border-b border-white/[0.08] px-4 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.12] font-[Sora] text-[10px] font-bold tracking-widest text-white">
                SMS
              </div>
              <div>
                <p className="font-[Sora] text-xs font-bold leading-tight text-white">Smart Monitoring</p>
                <p className="text-[10px] text-white/35 mt-0.5">TVPlus Platform</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-[13px] no-underline transition-all duration-[120ms] ` +
                  (isActive
                    ? `border-l-[${COLOR}] bg-white/[0.09] font-semibold text-white`
                    : 'border-l-transparent font-normal text-white/50 hover:bg-white/[0.05] hover:text-white/80')
                }
              >
                <span className="w-[18px] shrink-0 text-center text-sm">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-white/[0.08] px-4 py-3.5 space-y-2">
            {user && (
              <p className="truncate text-[11px] text-white/40 px-1">
                Signed in as <span className="text-white/70 font-medium">{user.name}</span>
              </p>
            )}
            {/* ← Portal clears app session and returns to shell */}
            <button
              onClick={handleGoPortal}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.06] py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white/90"
            >
              ← Portal
            </button>
          </div>
        </nav>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-[52px] shrink-0 items-center border-b border-slate-200 bg-white px-6">
            <span className="text-[13px] font-medium text-slate-500">Smart Monitoring · Real-time Observability</span>
          </div>
          <div className="flex-1 overflow-auto bg-slate-50 p-7">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <Routes>
                <Route path="/*" element={<Dashboard />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

function FullPageLoader() {
  return <div className="flex h-screen items-center justify-center bg-slate-100"><Skeleton className="h-10 w-48" /></div>;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}
