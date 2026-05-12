import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const TOKEN_KEY = 'cms_auth_token';

export interface AppUser { id: string; name: string; email: string; role: string }
interface AuthState { user: AppUser | null; token: string | null; loading: boolean; error: string | null }

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5001/api/mock/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return rejectWithValue(((await res.json()).error) ?? 'Login failed');
    const data = await res.json() as { token: string; user: AppUser };
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: localStorage.getItem(TOKEN_KEY), loading: false, error: null } as AuthState,
  reducers: {
    logout(state) { state.user = null; state.token = null; localStorage.removeItem(TOKEN_KEY); },
  },
  extraReducers: b => b
    .addCase(loginAsync.pending,   s => { s.loading = true; s.error = null; })
    .addCase(loginAsync.fulfilled, (s, { payload }) => { s.loading = false; s.user = payload.user; s.token = payload.token; })
    .addCase(loginAsync.rejected,  (s, { payload }) => { s.loading = false; s.error = payload as string; }),
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
