import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const TOKEN_KEY = 'sms_auth_token';

export interface AppUser { id: string; name: string; email: string; role: string }

interface AuthState {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
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
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  }
);

const initialToken = localStorage.getItem(TOKEN_KEY);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: initialToken,
    loading: false,
    error: null,
  } as AuthState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginAsync.pending, state => { state.loading = true; state.error = null; })
      .addCase(loginAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
      })
      .addCase(loginAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
