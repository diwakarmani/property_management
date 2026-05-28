/**
 * Jest config for the React Native (Expo) app.
 * Uses the jest-expo preset so Expo/React Native modules transform & mock correctly.
 */
module.exports = {
  preset: 'jest-expo',
  // Mocks native modules (AsyncStorage, SecureStore, Toast) before tests run.
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Map the "@/..." path alias (mirrors tsconfig.json paths).
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // RN / Expo / navigation / redux ship untranspiled ESM — let Babel transform them.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-toast-message|@reduxjs/toolkit|redux|react-redux|immer))',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  clearMocks: true,
};
