import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, User, UserRole } from './types.ts';
import { MOCK_USERS } from './mock-users.ts';
import { encodeToken, decodeToken } from './jwt.ts';

const TOKEN_KEY = 'tvplus_auth_token';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeToken(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    (globalThis as any).__tvplus_auth = { user, token };
  }, [user, token]);

  const login = (userId: string) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (!found) return;
    const t = encodeToken(found);
    localStorage.setItem(TOKEN_KEY, t);
    setUser(found);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  const hasRole = (...roles: UserRole[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  // Remotes bundle their own copy of @repo/auth — read from window bridge instead.
  const bridged = (globalThis as any).__tvplus_auth as { user: User | null; token: string | null } | undefined;
  if (!bridged) throw new Error('useAuth: AuthProvider not mounted and no auth bridge found');
  return {
    user: bridged.user,
    token: bridged.token,
    login: () => {},
    logout: () => {},
    hasRole: (...roles: UserRole[]) => !!bridged.user && roles.includes(bridged.user.role),
  };
}
