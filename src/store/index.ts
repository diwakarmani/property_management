import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';

// `discoverySlice` deleted (gap analysis FE-09 follow-up) — the home feed and
// view-more pagination are now served by `useHomeFeedQuery` /
// `useViewMoreInfiniteQuery` (TanStack Query). Redux now owns only auth + UI state.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;