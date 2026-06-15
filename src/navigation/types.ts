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
};

// ── Buyer / default flow ──────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeMain: undefined;
  ViewMore: { category?: string } | undefined;
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: NavigatorScreenParams<HomeStackParamList>;
  Favorites: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
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
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// ── Realtor flow ──────────────────────────────────────────────────────────
export type RealtorTabParamList = {
  Dashboard: undefined;
  MyListings: NavigatorScreenParams<ListingsStackParamList>;
  Create: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// ── Profile stack ─────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Addresses: undefined;
  Notifications: undefined;
};
