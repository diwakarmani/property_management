import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

/**
 * Named staleTime tiers — use these in every useQuery instead of magic numbers.
 *
 * STATIC  (30 min) — near-static reference data: property types, role lists
 * SLOW    (5 min)  — content that rarely changes mid-session: property detail, home feed
 * MEDIUM  (2 min)  — user-driven data with mutation invalidation: listings, favorites, stats, inquiries
 * DEFAULT (30 s)   — global fallback: search results (each filter combo = own cache key)
 * LIVE    (10 s)   — real-time feel required: unread notification badge
 */
export const STALE_TIME = {
  STATIC: 30 * 60 * 1000,
  SLOW:    5 * 60 * 1000,
  MEDIUM:      30 * 1000,
  DEFAULT:      30 * 1000,
  LIVE:         10 * 1000,
} as const;

// Axios interceptor already shows toasts for all Axios errors (has `config` on the error object).
// This fires for non-Axios errors (e.g. unexpected JS throws inside a mutation function)
// that would otherwise be silently swallowed.
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

/**
 * Stable namespacing for query keys — prevents typos and collisions when
 * invalidating caches from mutations.
 */
export const queryKeys = {
  listingCount: (city: string) => ['listing-count', city] as const,
  favorites: ['favorites'] as const,
  /** Flat number[] of all favorited property IDs — used by card screens for O(1) heart state. */
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
