import type { Item } from '../types';
import { fuzzyFilter } from './fuzzy';

export type OrderedItem = Item & { _mruRank?: number };

/**
 * Separates items into selected/unselected.
 * Selected items are already in MRU order (selectedIds maintains MRU order).
 * Shared logic for both sync and async ordering.
 */
function separateItems(
    items: Item[],
    selectedIds: string[]
): { selected: OrderedItem[]; unselected: OrderedItem[] } {
    const selectedSet = new Set(selectedIds);
    const selected: OrderedItem[] = [];
    const unselected: OrderedItem[] = [];

    // Create a map for O(1) lookup of selected item order
    const selectedOrder = new Map<string, number>();
    selectedIds.forEach((id, i) => selectedOrder.set(id, i));

    for (const it of items) {
        const base: OrderedItem = { ...it };
        if (selectedSet.has(it.id)) {
            selected.push(base);
        } else {
            unselected.push(base);
        }
    }

    // Sort selected items by their order in selectedIds (which is MRU order)
    selected.sort((a, b) => {
        const orderA = selectedOrder.get(a.id) ?? Infinity;
        const orderB = selectedOrder.get(b.id) ?? Infinity;
        return orderA - orderB;
    });

    return { selected, unselected };
}

/**
 * Orders items for sync mode: pins selected items to top (MRU order),
 * applies fuzzy search filtering to unselected items.
 *
 * @param items - All available items
 * @param selectedIds - Currently selected item IDs (already in MRU order)
 * @param query - Search query string
 * @returns Ordered array with selected items first, then filtered unselected items
 *
 * @public
 */
export function orderItemsSync(
    items: Item[],
    selectedIds: string[],
    query: string
): OrderedItem[] {
    const { selected, unselected } = separateItems(items, selectedIds);

    // If no query, return all items (selected first, then unselected)
    if (!query) {
        return [...selected, ...unselected];
    }

    // Apply fuzzy search filtering to unselected items
    const scored = fuzzyFilter(unselected, (i) => i.label, query);
    return [...selected, ...scored.map(s => s.item as OrderedItem)];
}

/**
 * Orders items for async mode: pins selected items to top (MRU order).
 * No client-side filtering (server handles filtering).
 *
 * @param items - Items fetched from server
 * @param selectedIds - Currently selected item IDs (already in MRU order)
 * @returns Ordered array with selected items first, then unselected items
 *
 * @public
 */
export function orderItemsAsync(
    items: Item[],
    selectedIds: string[]
): OrderedItem[] {
    const { selected, unselected } = separateItems(items, selectedIds);
    return [...selected, ...unselected];
}

