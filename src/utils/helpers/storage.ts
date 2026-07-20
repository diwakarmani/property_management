import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
};

const ACTIVE_ROLE_KEY = 'active_role';

export const saveActiveRole = async (role: string): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
};

export const getActiveRole = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACTIVE_ROLE_KEY);
};

export const clearActiveRole = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
};

export const set = async (key: string, value: any) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const get = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

export const remove = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

export const clear = async () => {
  await AsyncStorage.clear();
};

// Biometric unlock preference/flags — non-sensitive booleans, so AsyncStorage
// (not SecureStore) is correct here. The actual session secrets stay solely in
// the token keys above; biometrics never introduces a second credential store.
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_PROMPT_SHOWN_KEY = 'biometric_prompt_shown';

export const getBiometricEnabled = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === 'true';
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const getBiometricPromptShown = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY)) === 'true';
};

export const setBiometricPromptShown = async (shown: boolean): Promise<void> => {
  await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, shown ? 'true' : 'false');
};

export const clearBiometricPreference = async (): Promise<void> => {
  await AsyncStorage.multiRemove([BIOMETRIC_ENABLED_KEY, BIOMETRIC_PROMPT_SHOWN_KEY]);
};