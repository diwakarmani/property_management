import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

// The one file in the app that imports `expo-local-authentication`. Everything
// else (Redux, navigation, screens) talks to the generic types/functions below,
// so adding Android fingerprint/face-unlock later only touches this file.
//
// 'faceId' is reserved for iOS Face ID specifically — Apple's trademarked term
// for its own hardware. Android face-unlock (also reported as
// AuthenticationType.FACIAL_RECOGNITION by this library, cross-platform) must
// never be labeled "Face ID"; it gets its own 'faceUnlock' type below.
export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'faceUnlock' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

// Shared UI copy/iconography so the three screens that reference biometrics
// (lock, enroll, profile toggle) can't drift out of sync with each other.
export const BIOMETRIC_LABEL: Record<BiometricType, string> = {
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Fingerprint',
  faceUnlock: 'Face Unlock',
  none: 'Biometric unlock',
};

export const BIOMETRIC_ICON: Record<BiometricType, string> = {
  faceId: 'scan-outline',
  touchId: 'finger-print-outline',
  fingerprint: 'finger-print-outline',
  faceUnlock: 'scan-outline',
  none: 'lock-closed-outline',
};

export const isHardwareAvailable = async (): Promise<boolean> => {
  return LocalAuthentication.hasHardwareAsync();
};

export const isEnrolled = async (): Promise<boolean> => {
  return LocalAuthentication.isEnrolledAsync();
};

// Returns every biometric type the device's hardware+enrollment actually
// supports — never just one. On iOS this array can only ever hold a single
// entry: `LAContext.biometryType` (what the native module reads under the
// hood) is a single hardware-determined value, so a device reporting both
// Face ID and Touch ID is a physical impossibility, not a software choice we
// make. On Android, a phone can genuinely expose fingerprint AND face
// hardware at once (the native module checks each `hasSystemFeature(...)`
// independently) — collapsing that to one preferred type would silently
// hide a method the user actually has enrolled. Callers must not assume
// "at most one" the way earlier code here did.
export const getSupportedTypes = async (): Promise<BiometricType[]> => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const result: BiometricType[] = [];

  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    result.push(Platform.OS === 'ios' ? 'faceId' : 'faceUnlock');
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    result.push(Platform.OS === 'ios' ? 'touchId' : 'fingerprint');
  }
  return result;
};

// Generic copy that never hides a second method when a device has more than
// one (only reachable on Android — see getSupportedTypes above).
export const formatBiometricLabel = (types: BiometricType[]): string => {
  if (types.length === 0) return BIOMETRIC_LABEL.none;
  return types.map((t) => BIOMETRIC_LABEL[t]).join(' or ');
};

export const authenticate = async (reason: string): Promise<BiometricAuthResult> => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
};

// The user deliberately backed out (tapped Cancel, or the system dismissed the
// sheet) — not a failure worth alarming them with, so the UI shows nothing.
const SILENT_ERROR_CODES = new Set(['user_cancel', 'app_cancel', 'system_cancel', 'user_fallback']);

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  authentication_failed: "Face wasn't recognized. Please try again.",
  lockout: 'Too many attempts. Use your device passcode to continue.',
  not_available: 'Biometric unlock is not available right now.',
  not_enrolled: 'No biometrics are set up on this device.',
};

// Raw expo-local-authentication error codes (e.g. "user_cancel") are internal
// identifiers, not user-facing copy — never render `error` directly in a screen.
export const getFriendlyBiometricError = (error?: string): string | null => {
  if (!error || SILENT_ERROR_CODES.has(error)) return null;
  return FRIENDLY_ERROR_MESSAGES[error] ?? 'Biometric unlock failed. Please try again.';
};
