import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { loginAsync } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/index';

export default function Login() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(s => s.auth);
  const [email, setEmail]       = useState('alice@tvplus.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginAsync({ email, password }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sans">
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#546BE8] to-[#0D1B70] font-[Sora] text-xs font-bold text-white">
            QCA
          </div>
          <div>
            <p className="font-[Sora] text-base font-bold text-slate-900">QC Automation</p>
            <p className="text-xs text-slate-500">TVPlus Platform</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access QCA</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alice@tvplus.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password123" required />
              </div>
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
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
