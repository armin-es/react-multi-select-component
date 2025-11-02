import type { Item } from '../types';
import { fuzzyFilter } from './fuzzy';

export type OrderedItem = Item & { _mruRank?: number };

/**
 * Orders items for sync mode: pins selected items to top (MRU order),
 * applies fuzzy search filtering to unselected items.
 *
 * @param items - All available items
 * @param selectedIds - Currently selected item IDs
 * @param query - Search query string
 * @param mruOrder - Most recently used order (newest first)
 * @returns Ordered array with selected items first, then filtered unselected items
 *
 * @public
 */
export function orderItemsSync(
    items: Item[],
    selectedIds: string[],
    query: string,
    mruOrder: string[]
): OrderedItem[] {
    const selectedSet = new Set(selectedIds);
    const selected: OrderedItem[] = [];
    const unselected: OrderedItem[] = [];

    for (const it of items) {
        const base: OrderedItem = { ...it };
        if (selectedSet.has(it.id)) selected.push(base);
        else unselected.push(base);
    }

    const mruIndex = new Map<string, number>();
    mruOrder.forEach((id, i) => mruIndex.set(id, i));
    selected.sort((a, b) => (mruIndex.get(a.id) ?? Infinity) - (mruIndex.get(b.id) ?? Infinity));

    if (!query) return [...selected, ...unselected];
    const scored = fuzzyFilter(unselected, (i) => i.label, query);
    return [...selected, ...scored.map(s => s.item as OrderedItem)];
}

/**
 * Orders items for async mode: pins selected items to top (MRU order).
 * No client-side filtering (server handles filtering).
 *
 * @param items - Items fetched from server
 * @param selectedIds - Currently selected item IDs
 * @param mruOrder - Most recently used order (newest first)
 * @returns Ordered array with selected items first, then unselected items
 *
 * @public
 */
export function orderItemsAsync(
    items: Item[],
    selectedIds: string[],
    mruOrder: string[]
): OrderedItem[] {
    const selectedSet = new Set(selectedIds);
    const selected: OrderedItem[] = [];
    const unselected: OrderedItem[] = [];

    for (const it of items) {
        const base: OrderedItem = { ...it };
        if (selectedSet.has(it.id)) selected.push(base);
        else unselected.push(base);
    }

    const mruIndex = new Map<string, number>();
    mruOrder.forEach((id, i) => mruIndex.set(id, i));
    selected.sort((a, b) => (mruIndex.get(a.id) ?? Infinity) - (mruIndex.get(b.id) ?? Infinity));

    return [...selected, ...unselected];
}

