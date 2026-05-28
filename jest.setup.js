/* eslint-disable no-undef */
// Jest setup — mocks native modules that have no JS implementation under Node.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

// The app's toast helper reads Platform.OS — short-circuit it in tests so
// failing-API tests that trip axios' toast paths don't crash on RN internals.
jest.mock('@/utils/toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));
