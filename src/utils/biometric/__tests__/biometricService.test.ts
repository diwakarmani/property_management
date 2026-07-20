import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import {
  isHardwareAvailable,
  isEnrolled,
  getSupportedTypes,
  formatBiometricLabel,
  authenticate,
  getFriendlyBiometricError,
  BIOMETRIC_LABEL,
} from '../biometricService';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

describe('biometricService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('isHardwareAvailable / isEnrolled', () => {
    it('reflects hardware absence', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      expect(await isHardwareAvailable()).toBe(false);
    });

    it('reflects no enrolled biometrics', async () => {
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      expect(await isEnrolled()).toBe(false);
    });
  });

  describe('getSupportedTypes', () => {
    afterEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('returns [faceId] on iOS when facial recognition is supported', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      expect(await getSupportedTypes()).toEqual(['faceId']);
    });

    it('returns [touchId] on iOS when only fingerprint is supported', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      expect(await getSupportedTypes()).toEqual(['touchId']);
    });

    it('returns [] when nothing is supported', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);
      expect(await getSupportedTypes()).toEqual([]);
    });

    // Regression coverage for the iOS/Android leak: expo-local-authentication's
    // FACIAL_RECOGNITION type is cross-platform (unlike IRIS, which the library
    // itself marks iOS-incompatible), so this must never resolve to 'faceId' —
    // Apple's trademarked term — on Android.
    it('never labels Android facial recognition as "Face ID" — returns faceUnlock instead', async () => {
      (Platform as any).OS = 'android';
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      const types = await getSupportedTypes();
      expect(types).toEqual(['faceUnlock']);
      expect(types).not.toContain('faceId');
      expect(BIOMETRIC_LABEL[types[0]]).not.toMatch(/Face ID/);
      expect(BIOMETRIC_LABEL[types[0]]).toBe('Face Unlock');
    });

    it('returns fingerprint (not touchId) on Android when only fingerprint is supported', async () => {
      (Platform as any).OS = 'android';
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      const types = await getSupportedTypes();
      expect(types).toEqual(['fingerprint']);
      expect(types).not.toContain('touchId');
    });

    // The actual fix: a device that supports both must report both — never
    // silently collapse to just the preferred one. iOS can never hit this
    // (no iPhone has both Face ID and Touch ID hardware), but Android phones
    // with both a face camera and a fingerprint sensor are common.
    it('reports BOTH methods when a device supports both (Android can; no iPhone does)', async () => {
      (Platform as any).OS = 'android';
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      const types = await getSupportedTypes();
      expect(types).toContain('faceUnlock');
      expect(types).toContain('fingerprint');
      expect(types).toHaveLength(2);
    });
  });

  describe('formatBiometricLabel', () => {
    it('formats a single type plainly', () => {
      expect(formatBiometricLabel(['faceId'])).toBe('Face ID');
      expect(formatBiometricLabel(['touchId'])).toBe('Touch ID');
    });

    it('joins multiple types instead of hiding one', () => {
      expect(formatBiometricLabel(['faceUnlock', 'fingerprint'])).toBe('Face Unlock or Fingerprint');
    });

    it('falls back to the generic label when nothing is supported', () => {
      expect(formatBiometricLabel([])).toBe('Biometric unlock');
    });
  });

  describe('authenticate', () => {
    it('returns success on a matching scan', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
      const result = await authenticate('Unlock PropertyApp');
      expect(result).toEqual({ success: true });
    });

    it('surfaces the error on a non-matching scan', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'authentication_failed',
      });
      const result = await authenticate('Unlock PropertyApp');
      expect(result).toEqual({ success: false, error: 'authentication_failed' });
    });

    it('surfaces the error on user cancellation', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });
      const result = await authenticate('Unlock PropertyApp');
      expect(result).toEqual({ success: false, error: 'user_cancel' });
    });
  });

  describe('getFriendlyBiometricError', () => {
    it('never surfaces a raw error code to the user', () => {
      const friendly = getFriendlyBiometricError('lockout');
      expect(friendly).not.toBe('lockout');
      expect(friendly).toMatch(/passcode/i);
    });

    it('shows nothing for user-initiated cancellation (not a real failure)', () => {
      expect(getFriendlyBiometricError('user_cancel')).toBeNull();
      expect(getFriendlyBiometricError('system_cancel')).toBeNull();
      expect(getFriendlyBiometricError('app_cancel')).toBeNull();
      expect(getFriendlyBiometricError('user_fallback')).toBeNull();
    });

    it('shows nothing when there is no error', () => {
      expect(getFriendlyBiometricError(undefined)).toBeNull();
    });

    it('falls back to a generic message for unrecognized codes', () => {
      expect(getFriendlyBiometricError('some_new_ios_error_code')).toBe(
        'Biometric unlock failed. Please try again.'
      );
    });
  });
});
