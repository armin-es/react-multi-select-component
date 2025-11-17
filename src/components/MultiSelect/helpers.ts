import type { Item } from '../../types';

/**
 * Helper to focus a token button by its label
 */
export function focusTokenButton(label: string): void {
  const button = document.querySelector(`[aria-label="Remove ${label}"]`) as HTMLElement;
  button?.focus();
}

/**
 * Get selected item from items array or selected items map
 */
export function getSelectedItem(
  id: string,
  isSync: boolean,
  items: Item[] | undefined,
  selectedItems: Map<string, Item>,
  asyncItems: Item[]
): Item | undefined {
  if (isSync && items) {
    return items.find(i => i.id === id);
  }
  // In async mode, check selected items first (persists across searches), then asyncItems
  return selectedItems.get(id) || asyncItems.find(i => i.id === id);
}

