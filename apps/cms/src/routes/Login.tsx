import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { loginAsync } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/index';

interface LoginProps {
  /** Passed from App.tsx — clears token and returns to shell portal */
  onGoPortal?: () => void;
}

export default function Login({ onGoPortal }: LoginProps) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(s => s.auth);
  const [email, setEmail]       = useState('alice@tvplus.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginAsync({ email, password }));
  };

  const inShell = typeof (globalThis as any).__tvplus_goHome === 'function' || !!onGoPortal;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 font-sans">

      {/* ← Portal escape hatch — always visible so users are never stuck */}
      {inShell && (
        <button
          onClick={onGoPortal}
          className="absolute left-4 top-4 flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          ← Back to Portal
        </button>
      )}

      <div className="w-full max-w-sm px-4">
        {/* App brand */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#0D1B70] to-[#060D3A] font-[Sora] text-xs font-bold text-white">
            CMS
          </div>
          <div>
            <p className="font-[Sora] text-base font-bold text-slate-900">Content Management</p>
            <p className="text-xs text-slate-500">TVPlus Platform</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in to CMS</CardTitle>
            <CardDescription>Enter your credentials to access this app</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alice@tvplus.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                  {inShell && (
                    <p className="mt-1 text-xs text-red-400">
                      Having trouble?{' '}
                      <button type="button" onClick={onGoPortal} className="underline hover:text-red-600">
                        Go back to portal
                      </button>
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Demo: <span className="font-medium">alice@tvplus.com</span> / <span className="font-medium">password123</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
