import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

export const STALE_TIME = {
  STATIC: 30 * 60 * 1000,
  SLOW:    5 * 60 * 1000,
  MEDIUM:      30 * 1000,
  DEFAULT:      30 * 1000,
  LIVE:         10 * 1000,
} as const;

const handleGlobalQueryError = (error: unknown) => {
  const err = error as any;
  if (!err?.config && !err?.response) {
    toast.error('Something went wrong. Please try again.');
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.DEFAULT,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
      onError: handleGlobalQueryError,
    },
  },
});

export const queryKeys = {
  listingCount: (city: string) => ['listing-count', city] as const,
  favorites: ['favorites'] as const,

  favoriteIds: ['favorite-ids'] as const,
  favoritesCheck: (propertyId: number) => ['favorites', 'check', propertyId] as const,
  property: (id: number) => ['property', id] as const,
  myListings: ['property', 'my-listings'] as const,
  notifications: ['notifications'] as const,
  notificationsUnreadCount: ['notifications', 'unread-count'] as const,
  inquiriesReceived: ['inquiries', 'received'] as const,
  inquiriesSent: ['inquiries', 'sent'] as const,
  realtorStats: ['realtor', 'stats'] as const,
  realtorProfile: (realtorId: number) => ['realtor', 'profile', realtorId] as const,
  realtorRatings: (realtorId: number) => ['realtor', 'ratings', realtorId] as const,
  myRating: (realtorId: number, propertyId: number) => ['realtor', 'ratings', realtorId, propertyId, 'my'] as const,
  compareProperties: (ids: number[]) =>
    ['favorites', 'compare', [...ids].sort((a, b) => a - b).join(',')] as const,
};
