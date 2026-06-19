import { useQuery } from '@tanstack/react-query';
import { LocationService } from '@/api/services/location.service';
import type { Locality } from '@/api/types/location.type';

/**
 * Searches neighborhoods for a city with optional keyword filtering.
 * Enabled only when cityId is set and keyword is at least 1 character.
 * Results are cached for 60 s per (cityId, keyword) pair.
 */
export const useLocalitySearch = (
  cityId: number | null | undefined,
  keyword: string,
) =>
  useQuery<Locality[]>({
    queryKey: ['locality-search', cityId, keyword],
    queryFn: () =>
      LocationService.getLocalities(cityId!, keyword || undefined).then(
        (r) => r.data.data ?? [],
      ),
    enabled: !!cityId && keyword.length >= 1,
    staleTime: 60_000,
  });
