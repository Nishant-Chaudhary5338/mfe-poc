import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DevUserRole = 'admin' | 'ops' | 'editor' | 'viewer';

export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: DevUserRole;
}

interface DevAuthCtx {
  user: DevUser | null;
  loading: boolean;
  login: (u: DevUser) => Promise<void>;
  logout: () => Promise<void>;
}

export const DevAuthContext = createContext<DevAuthCtx | null>(null);

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DevUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dev-session')
      .then(r => r.json())
      .then(d => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(u: DevUser) {
    await fetch('/api/dev-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: u }),
    });
    setUser(u);
  }

  async function logout() {
    await fetch('/api/dev-session', { method: 'DELETE' });
    setUser(null);
  }

  return (
    <DevAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth(): DevAuthCtx {
  const ctx = useContext(DevAuthContext);
  if (!ctx) throw new Error('useDevAuth: no DevAuthProvider found');
  return ctx;
}
