import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyFilter } from './fuzzy';

describe('fuzzyScore', () => {
  it('returns 0 for empty query', () => {
    expect(fuzzyScore('Alpha Beta', '')).toBe(0);
  });

  it('returns null when no match found', () => {
    expect(fuzzyScore('Alpha Beta', 'xyz')).toBeNull();
  });

  it('returns low score for prefix matches', () => {
    const score = fuzzyScore('Alpha Beta', 'al');
    expect(score).not.toBeNull();
    expect(score).toBeLessThan(5);
  });

  it('returns low score for exact matches', () => {
    const score = fuzzyScore('Alpha Beta', 'Alpha Beta');
    expect(score).not.toBeNull();
    expect(score).toBeLessThan(5);
  });

  it('returns score for subsequence matches', () => {
    const score = fuzzyScore('Alpha Beta', 'ab');
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('is case-insensitive', () => {
    const lower = fuzzyScore('Alpha Beta', 'al');
    const upper = fuzzyScore('Alpha Beta', 'AL');
    expect(lower).toBe(upper);
  });

  it('prioritizes prefix over subsequence', () => {
    const prefix = fuzzyScore('Alpha Beta', 'al');
    const subseq = fuzzyScore('Beta Alpha', 'al');
    expect(prefix).toBeLessThan(subseq!);
  });
});

describe('fuzzyFilter', () => {
  const items = [
    { id: '1', label: 'Alpha Beta' },
    { id: '2', label: 'Gamma Delta' },
    { id: '3', label: 'Alpha Gamma' },
    { id: '4', label: 'Beta Prime' },
  ];

  it('returns empty array for no matches', () => {
    const results = fuzzyFilter(items, item => item.label, 'xyz');
    expect(results).toEqual([]);
  });

  it('filters and sorts by relevance', () => {
    const results = fuzzyFilter(items, item => item.label, 'al');
    expect(results.length).toBeGreaterThan(0);
    // Safe to access results[0] after length check
    const firstResult = results[0]!;
    expect(firstResult.item.label).toMatch(/alpha/i);
    // Results should be sorted (lower score = better)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]!.score).toBeLessThanOrEqual(results[i + 1]!.score);
    }
  });

  it('respects limit parameter', () => {
    const results = fuzzyFilter(items, item => item.label, 'a', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('includes all matches when limit not provided', () => {
    const results = fuzzyFilter(items, item => item.label, 'a');
    expect(results.length).toBeGreaterThan(0);
  });
});

