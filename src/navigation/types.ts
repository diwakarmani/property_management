export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { identifier: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { token?: string };
};