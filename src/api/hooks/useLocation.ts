import { useQuery } from '@tanstack/react-query';
import { LocationService } from '@/api/services/location.service';
import type { Locality } from '@/api/types/location.type';

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
