import { describe, it, expect } from 'vitest';
import { orderItemsSync, orderItemsAsync } from './ordering';
import type { Item } from '../types';

const mockItems: Item[] = [
    { id: '1', label: 'Alpha', group: 'A' },
    { id: '2', label: 'Beta', group: 'B' },
    { id: '3', label: 'Gamma', group: 'A' },
    { id: '4', label: 'Delta', group: 'B' },
];

describe('orderItemsSync', () => {
    it('pins selected items to top', () => {
        const result = orderItemsSync(mockItems, ['2', '4'], '', []);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]!.id).toBe('2');
        expect(result[1]!.id).toBe('4');
        expect(result.slice(2).map(i => i.id)).toEqual(['1', '3']);
    });

    it('orders selected items by MRU', () => {
        const result = orderItemsSync(mockItems, ['1', '2'], '', ['2', '1']);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0]!.id).toBe('2'); // Most recently used
        expect(result[1]!.id).toBe('1');
    });

    it('filters unselected items by query', () => {
        const result = orderItemsSync(mockItems, [], 'al', []);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some(i => i.label.includes('Alpha'))).toBe(true);
        expect(result.some(i => i.label.includes('Beta'))).toBe(false);
    });

    it('returns all items when query is empty', () => {
        const result = orderItemsSync(mockItems, [], '', []);
        expect(result.length).toBe(mockItems.length);
    });
});

describe('orderItemsAsync', () => {
    it('pins selected items to top', () => {
        const result = orderItemsAsync(mockItems, ['2', '4'], []);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0]!.id).toBe('2');
        expect(result[1]!.id).toBe('4');
        expect(result.slice(2).map(i => i.id)).toEqual(['1', '3']);
    });

    it('orders selected items by MRU', () => {
        const result = orderItemsAsync(mockItems, ['1', '2'], ['2', '1']);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0]!.id).toBe('2');
        expect(result[1]!.id).toBe('1');
    });

    it('returns all items without filtering', () => {
        const result = orderItemsAsync(mockItems, [], []);
        expect(result.length).toBe(mockItems.length);
    });
});

