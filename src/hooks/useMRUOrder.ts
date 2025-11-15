import { useState, useCallback } from 'react';

/**
 * Custom hook for managing Most Recently Used (MRU) ordering of items.
 * Tracks the order in which items were selected/used, with most recent first.
 */
export function useMRUOrder() {
    const [mruOrder, setMruOrder] = useState<string[]>([]);

    /**
     * Updates MRU order when an item is selected or removed.
     * Moves the item to the front of the MRU list.
     */
    const updateMRU = useCallback((id: string) => {
        setMruOrder(prev => {
            const filtered = prev.filter(x => x !== id);
            return [id, ...filtered];
        });
    }, []);

    /**
     * Updates MRU order when an item is removed via Backspace.
     * Moves the removed item to the front (so it can be easily re-selected).
     */
    const updateMRUOnRemove = useCallback((id: string) => {
        setMruOrder(prev => [id, ...prev.filter(x => x !== id)]);
    }, []);

    return {
        mruOrder,
        setMruOrder,
        updateMRU,
        updateMRUOnRemove,
    };
}

