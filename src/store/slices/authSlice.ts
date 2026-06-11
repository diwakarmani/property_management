import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '@/api/services/auth.service';
import { saveTokens, clearTokens, getAccessToken } from '@/utils/helpers/storage';
import type { LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest } from '@/api/types/auth.types';

interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  roles: string[];
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  occupation?: string;
  website?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpIdentifier: string | null;
  /** True once boot-time session restore has *succeeded* (user known, or definitively unauthenticated). */
  bootstrapped: boolean;
  /** True when bootstrap retries were exhausted (server unreachable) → BootScreen shows Retry. */
  bootstrapFailed: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
  otpIdentifier: null,
  bootstrapped: false,
  bootstrapFailed: false,
};

/** Normalises a backend UserDTO / AuthResponse / OtpVerificationResponse into the local User shape. */
const toUser = (payload: any): User => {
  const rawRoles = payload?.roles;
  const roles: string[] = Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles
      ? Array.from(rawRoles)
      : ['BUYER'];
  return {
    // OtpVerificationResponse uses `id`; all other responses also use `id` now
    id: payload?.id,
    email: payload?.email,
    firstName: payload?.firstName,
    lastName: payload?.lastName,
    phone: payload?.phone,
    profileImageUrl: payload?.profileImageUrl,
    roles,
    bio: payload?.bio,
    gender: payload?.gender,
    dateOfBirth: payload?.dateOfBirth,
    occupation: payload?.occupation,
    website: payload?.website,
  };
};

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(data);
      const authData = response.data.data;
      await saveTokens(authData.accessToken, authData.refreshToken);
      return authData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getCurrentUser(); // GET /api/users/me
      return response.data.data; // UserDTO with roles
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

/**
 * Boot-time session restore (KB-01 / NB-03 / NB-15).
 * If a stored access token exists, fetches the current user with exponential
 * backoff so a cold Render backend (~50s) does not bounce the user to Login.
 * - 401/403 → token is genuinely dead → unauthenticated (go to Login).
 * - network/timeout/5xx → retried; if all retries fail → rejected (Retry UI).
 */
export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    const token = await getAccessToken();
    if (!token) {
      return { authenticated: false as const };
    }

    const delays = [0, 2000, 4000, 8000, 16000]; // ~30s retry budget

    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
      try {
        const response = await AuthService.getCurrentUser();
        return { authenticated: true as const, user: response.data.data };
      } catch (error: any) {
        const status = error?.response?.status;
        // The axios interceptor auto-refreshes on 401 and clears tokens if the
        // refresh fails. A 401/403 here — or tokens that have vanished — means
        // the session is genuinely dead → route to Login (not Retry).
        const tokenStillPresent = await getAccessToken();
        if (status === 401 || status === 403 || !tokenStillPresent) {
          await clearTokens();
          return { authenticated: false as const };
        }
        // network error / timeout / 5xx → likely a cold backend; retry.
      }
    }

    // Retries exhausted but the token is still valid-looking → server
    // unreachable. Reject so BootScreen shows a Retry button.
    return rejectWithValue('bootstrap-failed');
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(data);
      const authData = response.data.data;
      await saveTokens(authData.accessToken, authData.refreshToken);
      return authData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (data: OtpSendRequest, { rejectWithValue }) => {
    try {
      await AuthService.sendOtp(data);
      return data.identifier;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data: OtpVerifyRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.verifyOtp(data);
      const authData = response.data.data;
      await saveTokens(authData.accessToken, authData.refreshToken);
      return authData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearTokens();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpIdentifier = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bootstrap (boot-time session restore)
      .addCase(bootstrapSession.pending, (state) => {
        state.loading = true;
        state.bootstrapFailed = false;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.loading = false;
        state.bootstrapped = true;
        state.bootstrapFailed = false;
        if (action.payload.authenticated && action.payload.user) {
          state.user = toUser(action.payload.user);
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(bootstrapSession.rejected, (state) => {
        // Retries exhausted — mark bootstrapped so the user reaches Login.
        state.loading = false;
        state.bootstrapped = true;
        state.bootstrapFailed = true;
        state.isAuthenticated = false;
      })
      // Fetch current user (NB-02)
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = toUser(action.payload);
        state.isAuthenticated = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = toUser(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register — backend only returns {message, email}, no token; do NOT set isAuthenticated
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpIdentifier = action.payload;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = toUser(action.payload);
        state.otpSent = false;
        state.otpIdentifier = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.bootstrapFailed = false;
      });
  },
});

export const { clearError, resetOtpState } = authSlice.actions;
export default authSlice.reducer;
