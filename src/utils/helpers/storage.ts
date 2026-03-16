import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage for tokens
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

// App storage
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