import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '@/api/services/auth.service';
import { saveTokens, clearTokens, getAccessToken } from '@/utils/helpers/storage';
import type { LoginRequest, RegisterRequest, OtpSendRequest, OtpVerifyRequest } from '@/api/types/auth.types';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];

}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpIdentifier: string | null;
  isInitialized: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  otpSent: false,
  otpIdentifier: null,
  isInitialized: false
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
      return response.data.data; // Returns user with roles
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(data);

      const authData = response.data.data;
      console.log(authData)
      // await saveTokens(authData.accessToken, authData.refreshToken);
      return authData;
    } catch (error: any) {
      console.log("Error in slice", error)
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

export const loadSavedAuth = createAsyncThunk(
  'auth/loadSavedAuth',
  async () => {
    const saved = await getAccessToken();
    return saved;
  }
);
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
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload,
          email: action.payload.email,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          roles: action.payload.roles || ['BUYER'],
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
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
        state.user = {
          email: action.payload.email,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          roles: action.payload.roles,
        };
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
      })

      //Load saved auth state
      .addCase(loadSavedAuth.fulfilled, (state, action) => {
        const saved = action.payload;

        if (saved) {
          state.isAuthenticated = true;
          state.isInitialized = true;

        }
        else {
          state.isInitialized = true;
        }
      });
  },
});

export const { clearError, resetOtpState } = authSlice.actions;
export default authSlice.reducer;
