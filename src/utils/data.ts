import type { Item } from '../types';

/**
 * Generates a dataset of items for demo purposes.
 * Uses deterministic patterns to create variety without randomness.
 *
 * @param count - Number of items to generate
 * @returns Array of generated items
 *
 * @example
 * ```ts
 * const items = generateDataset(100);
 * // Creates 100 items with labels like "Alpha Alpha #1", "Beta Omega #2", etc.
 * ```
 */
export function generateDataset(count: number): Item[] {
    const groups = ['Provider', 'Account', 'Tag', 'Region', 'Service'];
    const words = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime', 'Core', 'Edge', 'Stream', 'Pulse', 'Atlas', 'Nimbus'];
    const items: Item[] = [];

    for (let i = 0; i < count; i++) {
        const w1 = words[i % words.length];
        const w2 = words[(i * 7) % words.length];
        const group = groups[i % groups.length];
        items.push({ id: String(i + 1), label: `${w1} ${w2} #${i + 1}`, group });
    }

    return items;
}

/**
 * Simulates a backend API that fetches items with pagination and search.
 * All data is pre-generated but loaded on-demand to simulate server behavior.
 *
 * @param query - Search query to filter items
 * @param page - Zero-indexed page number
 * @param delay - Artificial delay in milliseconds to simulate network latency
 * @returns Promise resolving to array of items for the current page
 *
 * @example
 * ```ts
 * const items = await fetchItems('alpha', 0, 500);
 * // Returns first 50 items matching 'alpha' after 500ms delay
 * ```
 */
export async function fetchItems(
    query: string,
    page: number,
    delay = 500
): Promise<Item[]> {
    // Pre-generate all items once (simulating a backend database)
    const ALL_ITEMS = generateDataset(10000);

    await new Promise(resolve => setTimeout(resolve, delay));

    const pageSize = 50;
    const offset = page * pageSize;

    // Simple substring filtering (could be replaced with server-side fuzzy search)
    let filtered = query
        ? ALL_ITEMS.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.group?.toLowerCase().includes(query.toLowerCase())
        )
        : ALL_ITEMS;

    return filtered.slice(offset, offset + pageSize);
}

