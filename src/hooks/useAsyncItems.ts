import { useState, useEffect, useRef, useCallback } from 'react';
import type { Item } from '../types';

type FetchItemsFn = (query: string, page: number) => Promise<Item[]>;

interface UseAsyncItemsOptions {
  fetchItems?: FetchItemsFn;
  query: string;
  pageSize: number;
  searchDelay: number;
  selectedIds: string[];
}

interface UseAsyncItemsReturn {
  asyncItems: Item[];
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  selectedItemsCache: Map<string, Item>;
  setSelectedItemsCache: React.Dispatch<React.SetStateAction<Map<string, Item>>>;
  loadMore: (reset?: boolean) => Promise<void>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  retry: () => void;
}

/**
 * Custom hook for managing async item fetching with pagination and debounced search.
 * Handles loading state, pagination, infinite scroll, and caching of selected items.
 */
export function useAsyncItems({
  fetchItems,
  query,
  pageSize,
  searchDelay,
  selectedIds,
}: UseAsyncItemsOptions): UseAsyncItemsReturn {
  const isAsync = !!fetchItems;

  const [asyncItems, setAsyncItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedItemsCache, setSelectedItemsCache] = useState<Map<string, Item>>(new Map());

  const pageRef = useRef(0);
  const queryRef = useRef('');
  const debounceTimerRef = useRef<number | null>(null);
  const fetchItemsRef = useRef(fetchItems);
  const loadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef('');

  const selectedSet = useRef(new Set(selectedIds));

  // Keep refs updated
  useEffect(() => {
    if (fetchItems) fetchItemsRef.current = fetchItems;
  }, [fetchItems]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    selectedSet.current = new Set(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Load more items
  const loadMore = useCallback(async (reset = false) => {
    if (!fetchItemsRef.current || loadingRef.current) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (reset) {
      pageRef.current = 0;
      setAsyncItems([]);
      setHasMore(true);
      setError(null);
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchItemsRef.current(queryRef.current, pageRef.current);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      setAsyncItems(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore(fetched.length >= pageSize);

      // Update cache with any newly fetched selected items
      setSelectedItemsCache(prev => {
        const nextCache = new Map(prev);
        fetched.forEach(item => {
          if (selectedSet.current.has(item.id)) {
            nextCache.set(item.id, item);
          }
        });
        return nextCache;
      });
      pageRef.current += 1;
    } catch (err) {
      // Ignore abort errors
      if (abortController.signal.aborted) {
        return;
      }

      // Handle other errors
      const error = err instanceof Error ? err : new Error('Failed to fetch items');
      setError(error);
      console.error('Error fetching items:', error);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [pageSize]);

  // Debounced search
  useEffect(() => {
    if (!isAsync) return;

    // Cancel any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel in-flight request if query changed
    if (query !== lastQueryRef.current && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    lastQueryRef.current = query;

    const delay = initialLoadDoneRef.current ? searchDelay : 0;
    debounceTimerRef.current = window.setTimeout(() => {
      initialLoadDoneRef.current = true;
      loadMore(true);
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isAsync, searchDelay, loadMore]);

  // Initial load
  useEffect(() => {
    if (isAsync && !initialLoadDoneRef.current) {
      loadMore(true);
    }
  }, [isAsync, loadMore]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isAsync) return;

    const target = e.currentTarget;
    const threshold = 100;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

    if (nearBottom && hasMore && !loadingRef.current && !error) {
      loadMore(false);
    }
  }, [isAsync, hasMore, loadMore, error]);

  // Retry function to retry failed requests
  const retry = useCallback(() => {
    setError(null);
    loadMore(true);
  }, [loadMore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    asyncItems,
    loading,
    hasMore,
    error,
    selectedItemsCache,
    setSelectedItemsCache,
    loadMore,
    handleScroll,
    retry,
  };
}


