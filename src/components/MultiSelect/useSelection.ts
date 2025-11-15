import { useCallback } from 'react';
import type { Item } from '../../types';

interface UseSelectionOptions {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    updateMRU: (id: string) => void;
    isAsync: boolean;
    asyncItems: Item[];
    setSelectedItemsCache: React.Dispatch<React.SetStateAction<Map<string, Item>>>;
    setQuery: (query: string) => void;
}

/**
 * Custom hook for handling item selection/deselection logic
 * Handles MRU updates, cache management, and query clearing
 */
export function useSelection({
    selectedIds,
    onChange,
    updateMRU,
    isAsync,
    asyncItems,
    setSelectedItemsCache,
    setQuery,
}: UseSelectionOptions) {
    const commitSelection = useCallback((id: string) => {
        const isRemoving = selectedIds.includes(id);
        const next = isRemoving
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id];

        onChange(next);
        updateMRU(id);

        // Update selected items cache for async mode
        if (isAsync) {
            setSelectedItemsCache(prev => {
                const nextCache = new Map(prev);
                if (isRemoving) {
                    nextCache.delete(id);
                } else {
                    const item = asyncItems.find(i => i.id === id);
                    if (item) {
                        nextCache.set(id, item);
                    }
                }
                return nextCache;
            });
        }

        // Clear search query after selection
        setQuery('');
    }, [
        selectedIds,
        onChange,
        updateMRU,
        isAsync,
        asyncItems,
        setSelectedItemsCache,
        setQuery,
    ]);

    return { commitSelection };
}

