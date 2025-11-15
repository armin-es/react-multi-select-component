import type { Item } from '../../types';

/**
 * Helper to focus a token button by its label
 */
export function focusTokenButton(label: string): void {
  const button = document.querySelector(`[aria-label="Remove ${label}"]`) as HTMLElement;
  button?.focus();
}

/**
 * Get selected item from items array or cache
 */
export function getSelectedItem(
  id: string,
  isSync: boolean,
  items: Item[] | undefined,
  selectedItemsCache: Map<string, Item>,
  asyncItems: Item[]
): Item | undefined {
  if (isSync && items) {
    return items.find(i => i.id === id);
  }
  // In async mode, check cache first (persists across searches), then asyncItems
  return selectedItemsCache.get(id) || asyncItems.find(i => i.id === id);
}

