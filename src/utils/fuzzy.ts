/**
 * Lightweight fuzzy matching utility for subsequence matching with scoring.
 * Prioritizes: prefix matches > word boundary matches > consecutive sequences.
 * 
 * @packageDocumentation
 */

/**
 * Result of fuzzy matching an item.
 * 
 * @public
 */
export type FuzzyCandidate<T> = {
    /** The matched item */
    item: T;
    /** Match score - lower is better (0 = perfect match) */
    score: number;
};

/**
 * Checks if a character position is at a word boundary.
 * 
 * @param s - String to check
 * @param i - Character index
 * @returns True if position is a word boundary
 * @internal
 */
function isWordBoundary(s: string, i: number): boolean {
    if (i === 0) return true;
    const prev = s[i - 1];
    return prev === ' ' || prev === '-' || prev === '_' || prev === '/';
}

/**
 * Computes a fuzzy match score for a query against a string.
 * 
 * The scoring algorithm:
 * - Base penalty: distance between matched characters
 * - Bonus: -5 for prefix matches
 * - Bonus: -3 for word boundary matches
 * - Bonus: negative consecutive sequence length (more consecutive = better)
 * - Lower scores indicate better matches (0 = perfect)
 * 
 * @param haystack - String to search in
 * @param needle - Query string to match
 * @returns Match score (lower is better) or `null` if no match found
 * 
 * @example
 * ```ts
 * fuzzyScore('Alpha Beta', 'ab'); // Returns low score (good match)
 * fuzzyScore('Alpha Beta', 'xyz'); // Returns null (no match)
 * ```
 * 
 * @public
 */
export function fuzzyScore(haystack: string, needle: string): number | null {
    if (!needle) return 0;
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();

    let hIdx = 0;
    let penalty = 0;
    let consecutive = 0;
    let firstMatchIndex = -1;

    for (let i = 0; i < n.length; i++) {
        const ch = n[i];
        let found = false;
        while (hIdx < h.length) {
            if (h[hIdx] === ch) {
                if (firstMatchIndex === -1) firstMatchIndex = hIdx;
                // reward consecutive sequences
                consecutive = (i > 0 && hIdx > 0 && h[hIdx - 1] === n[i - 1]) ? consecutive + 1 : 1;
                // reduce penalty for word starts
                if (isWordBoundary(h, hIdx)) penalty -= 1;
                found = true;
                hIdx++;
                break;
            }
            penalty += 1; // distance skipped
            hIdx++;
        }
        if (!found) return null;
    }

    // Prefer prefix and whole word matches
    const prefixBonus = h.startsWith(n) ? -5 : 0;
    const wordBonus = isWordBoundary(h, firstMatchIndex) ? -3 : 0;
    const consecutiveBonus = -consecutive; // more consecutive -> better

    return Math.max(0, penalty + prefixBonus + wordBonus + consecutiveBonus);
}

/**
 * Filters and scores items using fuzzy matching.
 * 
 * Returns items sorted by match quality (best matches first).
 * Items that don't match are excluded.
 * 
 * @param items - Array of items to filter
 * @param getText - Function to extract searchable text from each item
 * @param query - Search query string
 * @param limit - Optional limit on number of results to return
 * @returns Array of matched items with scores, sorted by score (best first)
 * 
 * @example
 * ```ts
 * const items = [
 *   { id: '1', name: 'Alpha Beta' },
 *   { id: '2', name: 'Gamma Delta' }
 * ];
 * const results = fuzzyFilter(items, item => item.name, 'ab');
 * // Returns items matching 'ab', sorted by relevance
 * ```
 * 
 * @public
 */
export function fuzzyFilter<T>(items: T[], getText: (t: T) => string, query: string, limit?: number): FuzzyCandidate<T>[] {
    const results: FuzzyCandidate<T>[] = [];
    for (const item of items) {
        const s = fuzzyScore(getText(item), query);
        if (s !== null) results.push({ item, score: s });
    }
    results.sort((a, b) => a.score - b.score);
    return typeof limit === 'number' ? results.slice(0, limit) : results;
}


