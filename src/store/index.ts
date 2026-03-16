import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import discoveryReducer from './slices/discoverySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    discovery: discoveryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;