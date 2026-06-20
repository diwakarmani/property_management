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
  RoleSelection: undefined;      // role picker popup for multi-role users
  LocationSetup: undefined;      // first-run buyer gate (no back stack)
  LocationSelection: undefined;  // re-selection from inside the app
  MainApp: undefined;
  Notifications: undefined;
};

// ── Buyer / default flow ──────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeMain: undefined;
  ViewMore: { category?: string } | undefined;
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
};

export type FavoritesStackParamList = {
  FavoritesMain: undefined;
  CompareProperties: { ids: number[] };
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
  RateRealtor: { realtorId: number; realtorName?: string; propertyId?: number };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: NavigatorScreenParams<HomeStackParamList>;
  Favorites: NavigatorScreenParams<FavoritesStackParamList>;
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
  SentInquiries: undefined;
  RateRealtor: { realtorId: number; realtorName?: string; propertyId?: number };
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
};
