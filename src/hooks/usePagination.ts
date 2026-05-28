import { useState, useCallback } from 'react';

interface PaginationOptions<T> {
  fetchFunction: (page: number, size: number) => Promise<{ content: T[]; hasMore: boolean }>;
  pageSize?: number;
}

export const usePagination = <T,>({ fetchFunction, pageSize = 20 }: PaginationOptions<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, pageSize);
      setData(prev => [...prev, ...result.content]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFunction, pageSize]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);

    try {
      const result = await fetchFunction(0, pageSize);
      setData(result.content);
      setHasMore(result.hasMore);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pageSize]);

  return { data, loading, hasMore, error, loadMore, refresh };
};