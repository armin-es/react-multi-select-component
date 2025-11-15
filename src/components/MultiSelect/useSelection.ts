import { useCallback } from 'react';
import type { Item } from '../../types';

interface UseSelectionOptions {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    isAsync: boolean;
    asyncItems: Item[];
    setSelectedItemsCache: React.Dispatch<React.SetStateAction<Map<string, Item>>>;
    setQuery: (query: string) => void;
}

/**
 * Custom hook for handling item selection/deselection logic
 * Maintains MRU order directly in selectedIds by always passing MRU-ordered arrays to onChange
 */
export function useSelection({
    selectedIds,
    onChange,
    isAsync,
    asyncItems,
    setSelectedItemsCache,
    setQuery,
}: UseSelectionOptions) {
    const commitSelection = useCallback((id: string) => {
        const isRemoving = selectedIds.includes(id);

        // Maintain MRU order: when selecting, move to front; when removing, just filter out
        const next = isRemoving
            ? selectedIds.filter(x => x !== id)
            : [id, ...selectedIds.filter(x => x !== id)]; // Move to front (MRU)

        onChange(next);

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
        isAsync,
        asyncItems,
        setSelectedItemsCache,
        setQuery,
    ]);

    return { commitSelection };
}

