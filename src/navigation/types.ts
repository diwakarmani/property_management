import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Per-navigator route param lists (Gap analysis NV-05).
 * Phase 0 establishes the typed surface; screens are migrated off `any`
 * navigation props incrementally in Phase 1.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { identifier: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { token?: string };
};

export type RootStackParamList = {
  Boot: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  LocationSelection: undefined;
  MainApp: undefined;
  // Registered at the root stack post-login so the shared Header can reach
  // them from any tab (navigate() bubbles up to the root navigator).
  Notifications: undefined;
};

// ── Buyer / default flow ──────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeMain: undefined;
  ViewMore: { category?: string } | undefined;
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: undefined;
  Favorites: undefined;
  Profile: undefined;
};

// ── Listing-management stack (shared by Seller & Realtor) ─────────────────
export type ListingsStackParamList = {
  MyListingsMain: undefined;
  EditListing: { propertyId?: number; id?: number } | undefined;
  PropertyImages: { propertyId?: number; id?: number } | undefined;
};

// ── Seller flow ───────────────────────────────────────────────────────────
export type SellerTabParamList = {
  Dashboard: undefined;
  MyListings: NavigatorScreenParams<ListingsStackParamList>;
  Create: undefined;
  Profile: undefined;
};

// ── Realtor flow ──────────────────────────────────────────────────────────
export type RealtorTabParamList = {
  Dashboard: undefined;
  MyListings: NavigatorScreenParams<ListingsStackParamList>;
  Create: undefined;
  Profile: undefined;
};

// ── Profile stack ─────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  ChangePassword: undefined;
  Addresses: undefined;
};
