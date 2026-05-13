if (__DEV__) {
  require("./ReactotronConfig");
}
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import type { AppDispatch } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadSavedLocation } from '@/store/slices/locationSlice';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Toast from 'react-native-toast-message';

/**
 * Inner App that can use Redux hooks
 */
function AppContent() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(loadSavedLocation());
  }, [dispatch]);

  return <AppNavigator />;
}

/**
 * Root App
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ErrorBoundary>
        <AppContent />
        <Toast />
        </ErrorBoundary>
      </Provider>
    </SafeAreaProvider>
  );
}