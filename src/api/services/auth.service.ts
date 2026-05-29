import axiosClient from '../client/axiosClient';
import { AUTH_ENDPOINTS } from '../client/endpoints';
import type {
  LoginRequest,
  RegisterRequest,
  OtpSendRequest,
  OtpVerifyRequest,
  AuthResponse,
  ApiResponse,
} from '../types/auth.types';

export const AuthService = {
  login: (data: LoginRequest) =>
    axiosClient.post<ApiResponse<AuthResponse>>(AUTH_ENDPOINTS.LOGIN, data),

  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<AuthResponse>>(AUTH_ENDPOINTS.REGISTER, data),

  sendOtp: (data: OtpSendRequest) =>
    axiosClient.post<ApiResponse<{ expiresIn: number }>>(AUTH_ENDPOINTS.OTP_SEND, data),

  verifyOtp: (data: OtpVerifyRequest) =>
    axiosClient.post<ApiResponse<AuthResponse>>(AUTH_ENDPOINTS.OTP_VERIFY, data),

  resendOtp: (data: OtpSendRequest) =>
    axiosClient.post<ApiResponse<{ expiresIn: number }>>(AUTH_ENDPOINTS.OTP_RESEND, data),

  forgotPassword: (email: string) =>
    axiosClient.post<ApiResponse<void>>(`${AUTH_ENDPOINTS.FORGOT_PASSWORD}?email=${email}`),

  resetPassword: (data: { token: string; newPassword: string }) =>
    axiosClient.post<ApiResponse<void>>(AUTH_ENDPOINTS.RESET_PASSWORD, data),

  getCurrentUser: () =>
    axiosClient.get<ApiResponse<any>>(AUTH_ENDPOINTS.ME, { skipErrorToast: true } as any),

  verifyEmail: (token: string) =>
    axiosClient.get<ApiResponse<void>>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
};