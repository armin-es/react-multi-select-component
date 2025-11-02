/**
 * Represents a selectable item in the multi-select dropdown.
 * 
 * @public
 */
export type Item = {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the item */
  label: string;
  /** Optional group/category for the item (useful for grouping/visual organization) */
  group?: string;
};

/**
 * Props for the MultiSelect component.
 * 
 * **Modes:**
 * - Sync mode: Provide `items` array for client-side filtering
 * - Async mode: Provide `fetchItems` function for server-side pagination
 * 
 * @public
 */
export type MultiSelectProps = {
  /**
   * Items array for sync mode.
   * Mutually exclusive with `fetchItems`.
   * When provided, enables in-memory filtering with fuzzy search and virtualization.
   * 
   * @example
   * ```tsx
   * <MultiSelect items={allItems} selectedIds={selected} onChange={setSelected} />
   * ```
   */
  items?: Item[];

  /**
   * Async fetch function for server-side pagination.
   * Mutually exclusive with `items`.
   * When provided, enables async mode with infinite scroll and debounced search.
   * 
   * @param query - Current search query string
   * @param page - Zero-indexed page number (starts at 0)
   * @returns Promise resolving to array of items for the current page
   * 
   * @example
   * ```tsx
   * <MultiSelect
   *   fetchItems={async (query, page) => {
   *     const res = await fetch(`/api/items?q=${query}&page=${page}`);
   *     return res.json();
   *   }}
   *   selectedIds={selected}
   *   onChange={setSelected}
   * />
   * ```
   */
  fetchItems?: (query: string, page: number) => Promise<Item[]>;

  /**
   * Array of selected item IDs (controlled component).
   * The component displays these as removable token chips.
   */
  selectedIds: string[];

  /**
   * Callback invoked when selection changes.
   * 
   * @param nextSelectedIds - New array of selected item IDs
   */
  onChange: (nextSelectedIds: string[]) => void;

  /**
   * Placeholder text shown in the search input when no items are selected.
   * 
   * @defaultValue `'Search…'`
   */
  placeholder?: string;

  /**
   * Label text displayed above the component.
   * Also used as the accessible label for screen readers.
   * 
   * @defaultValue `'Choose items'`
   */
  label?: string;

  /**
   * Whether the component is disabled.
   * When disabled, user cannot interact with the component.
   * 
   * @defaultValue `false`
   */
  disabled?: boolean;

  /**
   * Approximate number of rows visible in the dropdown viewport.
   * Used to calculate dropdown height and virtualization (sync mode).
   * 
   * @defaultValue `8`
   */
  visibleRows?: number;

  /**
   * Height of each row in pixels.
   * Used for virtualization calculations (sync mode) and list rendering.
   * 
   * @defaultValue `36`
   */
  rowHeight?: number;

  /**
   * Search debounce delay in milliseconds (async mode only).
   * Prevents excessive API calls while user is typing.
   * 
   * @defaultValue `300`
   */
  searchDelay?: number;

  /**
   * Number of items to fetch per page (async mode only).
   * Determines when to stop pagination (when response length < pageSize).
   * 
   * @defaultValue `50`
   */
  pageSize?: number;
};


