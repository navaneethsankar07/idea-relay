import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthResponse } from '../../types/auth';
import { authApi, LoginPayload, RegisterPayload } from '../../api/authApi';
import { setAccessToken } from '../../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getProfile();
      return user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authApi.login(credentials);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk<AuthResponse, RegisterPayload, { rejectValue: string }>(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.register(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logoutUser',
  async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setAccessToken(null);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; accessToken?: string }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      if (action.payload.accessToken) {
        setAccessToken(action.payload.accessToken);
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      setAccessToken(null);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      });

    // registerUser
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { setAuth, updateUser, clearAuth, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
