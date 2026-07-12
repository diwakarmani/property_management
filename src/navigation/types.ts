import type { NavigatorScreenParams } from '@react-navigation/native';

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
  RoleSelection: undefined;
  LocationSetup: undefined;
  LocationSelection: undefined;
  MainApp: undefined;
  Notifications: undefined;
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
  ContactAgent: { propertyId: number; propertyTitle?: string };
};

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

export type ListingsStackParamList = {
  MyListingsMain: undefined;
  EditListing: { propertyId?: number; id?: number } | undefined;
  PropertyImages: { propertyId?: number; id?: number } | undefined;
};

export type SellerTabParamList = {
  Dashboard: undefined;
  MyListings: NavigatorScreenParams<ListingsStackParamList>;
  Create: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RealtorTabParamList = {
  Dashboard: undefined;
  MyListings: NavigatorScreenParams<ListingsStackParamList>;
  Create: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ChangeContact: { contactType: 'phone' | 'email' };
  Addresses: undefined;
  Notifications: undefined;
  SentInquiries: undefined;
  RateRealtor: { realtorId: number; realtorName?: string; propertyId?: number };
  PropertyDetail: { propertyId?: number; id?: number } | undefined;
  ContactAgent: { propertyId: number; propertyTitle?: string };
  RealtorProfile: { realtorId: number; propertyId?: number; propertyTitle?: string };
};
