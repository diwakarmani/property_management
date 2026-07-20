import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '@/api/services/auth.service';
import {
  saveTokens, clearTokens, getAccessToken, saveActiveRole, getActiveRole, clearActiveRole, remove,
  getBiometricEnabled, setBiometricEnabled, getBiometricPromptShown, setBiometricPromptShown, clearBiometricPreference,
} from '@/utils/helpers/storage';
import { queryClient } from '@/api/queryClient';
import type { LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest } from '@/api/types/auth.types';
import { getAvailableRoles, pickRoleKey, isRoleValid, type RoleKey } from '@/utils/roleUtils';
import * as biometricService from '@/utils/biometric/biometricService';
import type { BiometricType } from '@/utils/biometric/biometricService';

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
  emailVerified?: boolean;
  phoneVerified?: boolean;
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

  // Biometric unlock — a local device gate in front of an already-authenticated
  // session. `biometricSupported`/`biometricTypes` are device facts (hardware +
  // enrollment); `biometricEnabled`/`biometricPromptShown` are per-account
  // preferences that get wiped on logout so a different user on the same
  // device never inherits them. `locked` is intentionally never persisted —
  // it's recomputed from `biometricEnabled` every time `bootstrapSession` runs.
  //
  // `biometricTypes` is a list, not a single value: on iOS it can only ever
  // hold one entry (a device can't physically have both Face ID and Touch
  // ID), but Android devices can genuinely report fingerprint AND face
  // hardware at once — collapsing that to "the preferred one" would silently
  // hide a method the user has actually enrolled.
  biometricSupported: boolean | null;
  biometricTypes: BiometricType[];
  biometricEnabled: boolean;
  biometricPromptShown: boolean;
  locked: boolean;
  biometricError: string | null;
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

  biometricSupported: null,
  biometricTypes: [],
  biometricEnabled: false,
  biometricPromptShown: false,
  locked: false,
  biometricError: null,
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
    emailVerified: payload?.emailVerified,
    phoneVerified: payload?.phoneVerified,
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
        // Read inline (not via a separately-dispatched loadBiometricState) so
        // `locked` can be computed deterministically in the same reducer that
        // sets `isAuthenticated`, with no race between two concurrent thunks.
        const biometricEnabled = await getBiometricEnabled();
        return { authenticated: true as const, user: response.data.data, storedRole, biometricEnabled };
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

// Device-capability probe, independent of auth state — dispatched once at boot
// alongside bootstrapSession. Never touches `locked` (bootstrapSession alone
// owns that, see above) so the two thunks can't race each other.
export const loadBiometricState = createAsyncThunk(
  'auth/loadBiometricState',
  async () => {
    const [hardwareOk, enrolled, biometricTypes, promptShown] = await Promise.all([
      biometricService.isHardwareAvailable(),
      biometricService.isEnrolled(),
      biometricService.getSupportedTypes(),
      getBiometricPromptShown(),
    ]);
    return {
      biometricSupported: hardwareOk && enrolled,
      biometricTypes,
      biometricPromptShown: promptShown,
    };
  }
);

// Requires one real successful scan before the preference is persisted — never
// flips the flag from a bare button tap.
export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, { rejectWithValue }) => {
    const result = await biometricService.authenticate('Enable biometric unlock for PropertyApp');
    await setBiometricPromptShown(true);
    if (!result.success) {
      return rejectWithValue(result.error || 'Authentication failed');
    }
    await setBiometricEnabled(true);
    return true;
  }
);

export const declineBiometricPrompt = createAsyncThunk(
  'auth/declineBiometricPrompt',
  async () => {
    await setBiometricPromptShown(true);
  }
);

export const disableBiometric = createAsyncThunk(
  'auth/disableBiometric',
  async () => {
    await setBiometricEnabled(false);
  }
);

export const unlockWithBiometrics = createAsyncThunk(
  'auth/unlockWithBiometrics',
  async (_, { rejectWithValue }) => {
    const [hardwareOk, enrolled] = await Promise.all([
      biometricService.isHardwareAvailable(),
      biometricService.isEnrolled(),
    ]);
    if (!hardwareOk || !enrolled) {
      // Fail-open: biometrics were turned off at the OS level after being
      // enabled in-app. There's no in-app fallback credential, so unlock
      // rather than trap the user, and stop offering biometrics on this device.
      await setBiometricEnabled(false);
      return { autoDisabled: true };
    }
    const result = await biometricService.authenticate('Unlock PropertyApp');
    if (!result.success) {
      return rejectWithValue(result.error || 'Authentication failed');
    }
    return { autoDisabled: false };
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearTokens();
  await clearActiveRole();
  await clearBiometricPreference();
  // Bug 14: `selectedLocation` is a single, non-user-scoped key. Without clearing it here, a
  // previous account's confirmed location silently carries over to the next login on this
  // device, making the buyer location-selection gate never show for that new session.
  await remove('selectedLocation');
  queryClient.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    resetOtpState: (state) => { state.otpSent = false; state.otpIdentifier = null; },
    // Merge updated contact fields (phone/email) into state without a full fetch round-trip
    patchUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
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

          state.biometricEnabled = action.payload.biometricEnabled ?? false;
          state.locked = state.biometricEnabled;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.activeRole = null;
          state.locked = false;
        }
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.loading = false;
        state.bootstrapped = true;
        state.bootstrapFailed = true;
        state.isAuthenticated = false;
        state.activeRole = null;
        state.locked = false;
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

      .addCase(loadBiometricState.fulfilled, (state, action) => {
        state.biometricSupported = action.payload.biometricSupported;
        state.biometricTypes = action.payload.biometricTypes;
        state.biometricPromptShown = action.payload.biometricPromptShown;
      })

      .addCase(enableBiometric.fulfilled, (state) => {
        state.biometricEnabled = true;
        state.biometricPromptShown = true;
        state.biometricError = null;
      })
      .addCase(enableBiometric.rejected, (state, action) => {
        state.biometricPromptShown = true;
        state.biometricError = action.payload as string;
      })

      .addCase(declineBiometricPrompt.fulfilled, (state) => {
        state.biometricPromptShown = true;
      })

      .addCase(disableBiometric.fulfilled, (state) => {
        state.biometricEnabled = false;
        state.locked = false;
      })

      .addCase(unlockWithBiometrics.fulfilled, (state, action) => {
        state.locked = false;
        state.biometricError = null;
        if (action.payload.autoDisabled) {
          state.biometricEnabled = false;
        }
      })
      .addCase(unlockWithBiometrics.rejected, (state, action) => {
        state.biometricError = action.payload as string;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.bootstrapFailed = false;
        state.activeRole = null;
        state.biometricEnabled = false;
        state.biometricPromptShown = false;
        state.locked = false;
      });
  },
});

export const { clearError, resetOtpState, patchUser } = authSlice.actions;
export default authSlice.reducer;
