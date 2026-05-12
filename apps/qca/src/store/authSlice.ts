import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const TOKEN_KEY = 'qca_auth_token';
const USER_KEY  = 'qca_auth_token_user';

export interface AppUser { id: string; name: string; email: string; role: string }

interface AuthState {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Restore both token AND user from localStorage so state is fully consistent after
// module re-init (page refresh, new browser tab, etc.)
function restoreState(): Pick<AuthState, 'token' | 'user'> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { token: null, user: null };
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AppUser | null;
    return { token, user };
  } catch {
    return { token, user: null };
  }
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('http://localhost:5001/api/mock/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      return rejectWithValue(err.error ?? 'Login failed');
    }
    const data = await res.json() as { token: string; user: AppUser };
    // Persist both token and user so restoreState() works on next module init
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    ...restoreState(),
    loading: false,
    error: null,
  } as AuthState,
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: b => b
    .addCase(loginAsync.pending,   s => { s.loading = true; s.error = null; })
    .addCase(loginAsync.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.user    = payload.user;
      s.token   = payload.token;
      s.error   = null;
    })
    .addCase(loginAsync.rejected,  (s, { payload }) => {
      s.loading = false;
      s.error   = payload as string ?? 'Login failed';
    }),
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
