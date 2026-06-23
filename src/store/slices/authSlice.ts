import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '@/api/services/auth.service';
import { saveTokens, clearTokens, getAccessToken, saveActiveRole, getActiveRole, clearActiveRole } from '@/utils/helpers/storage';
import { queryClient } from '@/api/queryClient';
import type { LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest } from '@/api/types/auth.types';
import { getAvailableRoles, pickRoleKey, isRoleValid, type RoleKey } from '@/utils/roleUtils';

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
  bootstrapped: boolean;
  bootstrapFailed: boolean;

  activeRole: RoleKey | null;
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
  activeRole: null,
};

const toUser = (payload: any): User => {
  const rawRoles = payload?.roles;
  const roles: string[] = Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles
      ? Array.from(rawRoles)
      : ['BUYER'];
  return {
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

const resolveActiveRole = (roles: string[]): RoleKey | null => {
  const available = getAvailableRoles(roles);
  return available.length === 1 ? available[0] : null;
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
      const response = await AuthService.getCurrentUser();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    const token = await getAccessToken();
    if (!token) return { authenticated: false as const };

    const delays = [0, 2000, 4000, 8000, 16000];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
      try {
        const response = await AuthService.getCurrentUser();
        const storedRole = await getActiveRole();
        return { authenticated: true as const, user: response.data.data, storedRole };
      } catch (error: any) {
        const status = error?.response?.status;
        const tokenStillPresent = await getAccessToken();
        if (status === 401 || status === 403 || !tokenStillPresent) {
          await clearTokens();
          await clearActiveRole();
          return { authenticated: false as const };
        }
      }
    }
    return rejectWithValue('bootstrap-failed');
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(data);
      const authData = response.data.data;
      if (authData?.accessToken && authData?.refreshToken) {
        await saveTokens(authData.accessToken, authData.refreshToken);
      }
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

export const selectRole = createAsyncThunk(
  'auth/selectRole',
  async (role: RoleKey) => {
    await saveActiveRole(role);
    return role;
  }
);

export const clearActiveRoleAndReselect = createAsyncThunk(
  'auth/clearActiveRole',
  async () => {
    await clearActiveRole();
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearTokens();
  await clearActiveRole();
  queryClient.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    resetOtpState: (state) => { state.otpSent = false; state.otpIdentifier = null; },
  },
  extraReducers: (builder) => {
    builder

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
          const stored = action.payload.storedRole ?? null;

          if (isRoleValid(stored, state.user?.roles)) {
            state.activeRole = stored as RoleKey;
          } else {
            state.activeRole = resolveActiveRole(state.user?.roles ?? []);
          }
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.activeRole = null;
        }
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.loading = false;
        state.bootstrapped = true;
        state.bootstrapFailed = true;
        state.isAuthenticated = false;
        state.activeRole = null;
      })

      .addCase(fetchUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = toUser(action.payload);
        state.isAuthenticated = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = toUser(action.payload);
        state.activeRole = resolveActiveRole(state.user?.roles ?? []);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state) => { state.loading = false; })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(sendOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpIdentifier = action.payload;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = toUser(action.payload);
        state.activeRole = resolveActiveRole(state.user?.roles ?? []);
        state.otpSent = false;
        state.otpIdentifier = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(selectRole.fulfilled, (state, action) => {
        state.activeRole = action.payload;
      })

      .addCase(clearActiveRoleAndReselect.fulfilled, (state) => {
        state.activeRole = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.bootstrapFailed = false;
        state.activeRole = null;
      });
  },
});

export const { clearError, resetOtpState } = authSlice.actions;
export default authSlice.reducer;
