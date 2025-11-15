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
  selectedItemsCache: Map<string, Item>;
  setSelectedItemsCache: React.Dispatch<React.SetStateAction<Map<string, Item>>>;
  loadMore: (reset?: boolean) => Promise<void>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
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
  const [selectedItemsCache, setSelectedItemsCache] = useState<Map<string, Item>>(new Map());

  const pageRef = useRef(0);
  const queryRef = useRef('');
  const debounceTimerRef = useRef<number | null>(null);
  const fetchItemsRef = useRef(fetchItems);
  const loadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

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

    if (reset) {
      pageRef.current = 0;
      setAsyncItems([]);
      setHasMore(true);
    }

    setLoading(true);
    try {
      const fetched = await fetchItemsRef.current(queryRef.current, pageRef.current);
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
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Debounced search
  useEffect(() => {
    if (!isAsync) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

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

    if (nearBottom && hasMore && !loadingRef.current) {
      loadMore(false);
    }
  }, [isAsync, hasMore, loadMore]);

  return {
    asyncItems,
    loading,
    hasMore,
    selectedItemsCache,
    setSelectedItemsCache,
    loadMore,
    handleScroll,
  };
}


