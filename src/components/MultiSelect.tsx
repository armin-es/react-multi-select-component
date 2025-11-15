import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { orderItemsSync, orderItemsAsync } from '../utils/ordering';
import type { MultiSelectProps } from '../types';
import type { OrderedItem } from '../utils/ordering';
import {
  useAsyncItems,
  useClickOutside,
  useFocusManagement,
  useScrollIntoView,
  useKeyboardNavigation,
} from '../hooks';
import {
  StatusMessage,
  ClearButton,
  Token,
  Listbox,
  useTokenNavigation,
  useSelection,
  useRenderRow,
  getSelectedItem as getSelectedItemUtil,
} from './MultiSelect/index';

/**
 * A performant, accessible multi-select dropdown component with support for large datasets.
 * 
 * Supports two modes:
 * - **Sync mode**: Pass `items` prop for in-memory filtering with fuzzy search and virtualization
 * - **Async mode**: Pass `fetchItems` prop for server-side pagination with infinite scroll
 * 
 * Features:
 * - Full keyboard navigation (Arrow keys, Enter, Space, Escape, Home, End, Backspace)
 * - WAI-ARIA compliant for screen readers
 * - MRU (Most Recently Used) ordering for selected items
 * - Fuzzy search (sync mode) or server-side search (async mode)
 * - Virtual scrolling for large lists (sync mode)
 * - Infinite scroll pagination (async mode)
 * - Click-outside to close
 * - Inline token/chip display with remove buttons
 * 
 * @example
 * ```tsx
 * // Sync mode - all items in memory
 * <MultiSelect
 *   items={allItems}
 *   selectedIds={selected}
 *   onChange={setSelected}
 *   placeholder="Search items..."
 *   label="Select items"
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Async mode - server-side pagination
 * <MultiSelect
 *   fetchItems={async (query, page) => {
 *     const res = await fetch(`/api/items?q=${query}&page=${page}`);
 *     return res.json();
 *   }}
 *   selectedIds={selected}
 *   onChange={setSelected}
 *   searchDelay={300}
 *   pageSize={50}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns JSX element
 * 
 * @throws {Error} If neither `items` nor `fetchItems` is provided
 * 
 * @see {@link MultiSelectProps} for prop details
 * 
 * @public
 */
export default function MultiSelect({
  items,
  fetchItems,
  selectedIds,
  onChange,
  placeholder = 'Search…',
  label = 'Choose items',
  disabled = false,
  visibleRows = 8,
  rowHeight = 36,
  searchDelay = 300,
  pageSize = 50,
}: MultiSelectProps) {
  const isAsync = !!fetchItems;
  const isSync = !!items;

  if (!isAsync && !isSync) {
    throw new Error('MultiSelect requires either `items` (sync) or `fetchItems` (async) prop');
  }

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const scrollingContainerRef = useRef<HTMLDivElement | null>(null);
  const virtualListContainerRef = useRef<HTMLDivElement | null>(null);

  const comboId = useId();
  const listboxId = `${comboId}-listbox`;

  // Custom hooks

  const {
    asyncItems,
    loading,
    hasMore,
    error,
    selectedItemsCache,
    setSelectedItemsCache,
    handleScroll,
    retry,
  } = useAsyncItems({
    fetchItems,
    query,
    pageSize,
    searchDelay,
    selectedIds,
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const orderedItems = useMemo(() => {
    if (isSync && items) {
      return orderItemsSync(items, selectedIds, query);
    }
    return orderItemsAsync(asyncItems, selectedIds);
  }, [isSync, items, asyncItems, selectedIds, query]);

  const { commitSelection } = useSelection({
    selectedIds,
    onChange,
    isAsync,
    asyncItems,
    setSelectedItemsCache,
    setQuery,
  });

  const {
    activeIndex,
    setActiveIndex,
    onKeyDown,
  } = useKeyboardNavigation({
    open,
    setOpen,
    orderedItems,
    selectedIds,
    query,
    commitSelection,
    onChange,
  });

  useClickOutside(comboboxRef, () => setOpen(false), open);
  useFocusManagement(open, inputRef);

  useScrollIntoView({
    activeIndex,
    isOpen: open,
    itemCount: orderedItems.length,
    isSync,
    rowHeight,
    listboxId,
    syncContainerRef: virtualListContainerRef,
    asyncContainerRef: scrollingContainerRef,
  });

  const height = visibleRows * rowHeight;

  // Find selected items for token display (works in both modes)
  const getSelectedItem = useCallback((id: string) => {
    return getSelectedItemUtil(id, isSync, items, selectedItemsCache, asyncItems);
  }, [isSync, items, selectedItemsCache, asyncItems]);

  const clearAll = useCallback(() => {
    onChange([]);
    if (isAsync) {
      setSelectedItemsCache(new Map());
    }
    inputRef.current?.focus();
  }, [onChange, isAsync, setSelectedItemsCache]);

  // Token navigation hook
  const { handleTokenKeyDown } = useTokenNavigation({
    selectedIds,
    getSelectedItem,
    commitSelection,
    inputRef,
  });

  // Render row hook for virtualized list (sync mode only)
  const renderRow = useRenderRow({
    activeIndex,
    selectedSet,
    listboxId,
    setActiveIndex,
    commitSelection,
  });

  const statusId = `${comboId}-status`;
  const helperId = `${comboId}-helper`;

  return (
    <div className="ms-root">
      <label className="ms-label-outer" htmlFor={comboId} id={helperId}>{label}</label>

      <StatusMessage
        loading={loading}
        isAsync={isAsync}
        open={open}
        itemCount={orderedItems.length}
        error={isAsync ? error : null}
        id={statusId}
      />

      <div
        ref={comboboxRef}
        className="ms-combobox"
        role="combobox"
        aria-haspopup="listbox"
        aria-owns={listboxId}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-disabled={disabled}
        aria-busy={loading && isAsync}
        aria-describedby={`${helperId} ${statusId}`}
        onKeyDown={onKeyDown}
      >
        <div className="ms-tokens" onClick={() => !disabled && setOpen(true)}>
          {selectedIds.map(id => {
            const it = getSelectedItem(id);
            if (!it) return null;
            return (
              <Token
                key={id}
                item={it}
                onRemove={commitSelection}
                onKeyDown={handleTokenKeyDown}
              />
            );
          })}
          <input
            ref={inputRef}
            id={comboId}
            className="ms-input"
            placeholder={selectedIds.length ? '' : placeholder}
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
            onBlur={(e) => {
              // Don't close if focus is moving to another element in the component
              const relatedTarget = e.relatedTarget as Node | null;
              if (relatedTarget && comboboxRef.current?.contains(relatedTarget)) {
                return;
              }
            }}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-label={label}
            aria-describedby={helperId}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {selectedIds.length > 0 && <ClearButton onClear={clearAll} />}
        </div>

        <div className="ms-popover" role="presentation" data-open={open} hidden={!open}>
          <Listbox
            isSync={isSync}
            orderedItems={orderedItems}
            loading={loading}
            hasMore={hasMore}
            error={isAsync ? error : null}
            onRetry={isAsync ? retry : undefined}
            listboxId={listboxId}
            activeIndex={activeIndex}
            selectedSet={selectedSet}
            rowHeight={rowHeight}
            height={height}
            renderRow={isSync ? renderRow : undefined}
            containerRef={isSync ? virtualListContainerRef : scrollingContainerRef}
            onScroll={handleScroll}
            onMouseEnter={setActiveIndex}
            onSelect={commitSelection}
          />
        </div>
      </div>
    </div>
  );
}
