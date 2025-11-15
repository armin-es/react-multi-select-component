import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { VirtualList } from './VirtualList';
import { orderItemsSync, orderItemsAsync } from '../utils/ordering';
import type { Item, MultiSelectProps } from '../types';
import type { OrderedItem } from '../utils/ordering';
import {
  useAsyncItems,
  useClickOutside,
  useFocusManagement,
  useScrollIntoView,
  useKeyboardNavigation,
  useMRUOrder,
} from '../hooks';

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
  const { mruOrder, updateMRU, updateMRUOnRemove } = useMRUOrder();

  const {
    asyncItems,
    loading,
    hasMore,
    selectedItemsCache,
    setSelectedItemsCache,
    handleScroll,
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
      return orderItemsSync(items, selectedIds, query, mruOrder);
    }
    return orderItemsAsync(asyncItems, selectedIds, mruOrder);
  }, [isSync, items, asyncItems, selectedIds, query, mruOrder]);

  const commitSelection = useCallback((id: string) => {
    const isRemoving = selectedSet.has(id);
    const next = isRemoving ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onChange(next);
    updateMRU(id);
    // Update selected items cache
    if (isAsync) {
      setSelectedItemsCache(prev => {
        const nextCache = new Map(prev);
        if (isRemoving) {
          nextCache.delete(id);
        } else {
          const item = asyncItems.find(i => i.id === id);
          if (item) {
            nextCache.set(id, item);
          }
        }
        return nextCache;
      });
    }
    setQuery('');
  }, [onChange, selectedIds, selectedSet, isAsync, asyncItems, updateMRU, setSelectedItemsCache]);

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
    setMruOrder: useCallback((updater: React.SetStateAction<string[]>) => {
      // The hook uses this pattern: setMruOrder(prev => [last, ...prev.filter(x => x !== last)])
      // So we extract the first item from the result and call updateMRUOnRemove
      if (typeof updater === 'function') {
        const newOrder = updater(mruOrder);
        const firstItem = newOrder[0];
        if (firstItem) {
          updateMRUOnRemove(firstItem);
        }
      } else {
        const firstItem = updater[0];
        if (firstItem) {
          updateMRUOnRemove(firstItem);
        }
      }
    }, [mruOrder, updateMRUOnRemove]),
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

  const clearAll = useCallback(() => {
    onChange([]);
    if (isAsync) {
      setSelectedItemsCache(new Map());
    }
    inputRef.current?.focus();
  }, [onChange, isAsync, setSelectedItemsCache]);

  const renderRow = (item: OrderedItem, index: number, style: CSSProperties) => {
    const active = index === activeIndex;
    const selected = selectedSet.has(item.id);
    const id = `${listboxId}-option-${index}`;
    const optionText = `${item.label}${item.group ? `, ${item.group}` : ''}${selected ? ', selected' : ''}`;

    return (
      <div
        key={item.id}
        id={id}
        role="option"
        aria-selected={selected}
        aria-label={optionText}
        data-active={active || undefined}
        data-selected={selected || undefined}
        className="ms-option"
        style={style}
        onMouseEnter={() => setActiveIndex(index)}
        onMouseDown={(e) => {
          e.preventDefault();
          commitSelection(item.id);
        }}
      >
        <span className="ms-label">{item.label}</span>
        {selected ? <span className="ms-check" aria-hidden="true">✓</span> : null}
      </div>
    );
  };

  // Find selected items for token display (works in both modes)
  const getSelectedItem = (id: string): Item | undefined => {
    if (isSync && items) return items.find(i => i.id === id);
    // In async mode, check cache first (persists across searches), then asyncItems
    return selectedItemsCache.get(id) || asyncItems.find(i => i.id === id);
  };

  const statusId = `${comboId}-status`;
  const helperId = `${comboId}-helper`;

  return (
    <div className="ms-root">
      <label className="ms-label-outer" htmlFor={comboId} id={helperId}>{label}</label>

      {/* Status announcements for screen readers */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
      >
        {loading && isAsync && 'Loading results'}
        {!loading && open && orderedItems.length === 0 && 'No results found'}
        {!loading && open && orderedItems.length > 0 && `${orderedItems.length} ${orderedItems.length === 1 ? 'option' : 'options'} available`}
      </div>

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
              <button
                type="button"
                key={id}
                className="ms-token"
                aria-label={`Remove ${it.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  commitSelection(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                    e.stopPropagation();

                    // Find next/prev token IDs and their labels (before removal)
                    const currentIndex = selectedIds.indexOf(id);
                    const nextId = currentIndex < selectedIds.length - 1
                      ? selectedIds[currentIndex + 1]
                      : null;
                    const prevId = currentIndex > 0
                      ? selectedIds[currentIndex - 1]
                      : null;

                    const nextLabel = nextId ? getSelectedItem(nextId)?.label : null;
                    const prevLabel = prevId ? getSelectedItem(prevId)?.label : null;

                    commitSelection(id);

                    // After removal, focus the next token, previous token, or input
                    requestAnimationFrame(() => {
                      if (nextLabel) {
                        // Focus the next token button
                        const nextButton = document.querySelector(`[aria-label="Remove ${nextLabel}"]`) as HTMLElement;
                        nextButton?.focus();
                      } else if (prevLabel) {
                        // Focus the previous token button
                        const prevButton = document.querySelector(`[aria-label="Remove ${prevLabel}"]`) as HTMLElement;
                        prevButton?.focus();
                      } else {
                        // No more tokens, focus the input
                        inputRef.current?.focus();
                      }
                    });
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    e.stopPropagation();

                    // Focus previous token or input
                    const currentIndex = selectedIds.indexOf(id);
                    const prevId = currentIndex > 0 ? selectedIds[currentIndex - 1] : null;

                    if (prevId) {
                      const prevLabel = getSelectedItem(prevId)?.label;
                      if (prevLabel) {
                        const prevButton = document.querySelector(`[aria-label="Remove ${prevLabel}"]`) as HTMLElement;
                        prevButton?.focus();
                      }
                    } else {
                      // At first token, focus the input
                      inputRef.current?.focus();
                    }
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    e.stopPropagation();

                    // Focus next token or input
                    const currentIndex = selectedIds.indexOf(id);
                    const nextId = currentIndex < selectedIds.length - 1 ? selectedIds[currentIndex + 1] : null;

                    if (nextId) {
                      const nextLabel = getSelectedItem(nextId)?.label;
                      if (nextLabel) {
                        const nextButton = document.querySelector(`[aria-label="Remove ${nextLabel}"]`) as HTMLElement;
                        nextButton?.focus();
                      }
                    } else {
                      // At last token, focus the input
                      inputRef.current?.focus();
                    }
                  }
                }}
              >
                <span>{it.label}</span>
                <span className="ms-token-x" aria-hidden>×</span>
              </button>
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
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="ms-clear"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  clearAll();
                } else if (e.key === 'Escape') {
                  // Allow Escape to propagate to combobox handler to close dropdown
                  // Don't prevent default or stop propagation
                }
              }}
              aria-label="Clear selected"
            >
              Clear
            </button>
          )}
        </div>

        <div className="ms-popover" role="presentation" data-open={open} hidden={!open}>
          {loading && isAsync && orderedItems.length === 0 ? (
            <div role="listbox" id={listboxId} aria-multiselectable>
              <div className="ms-empty">
                <span className="ms-spinner" aria-hidden="true"></span>
                <span>Loading results...</span>
              </div>
            </div>
          ) : orderedItems.length === 0 ? (
            <div role="listbox" id={listboxId} aria-multiselectable>
              <div className="ms-empty">
                <span>No results found</span>
              </div>
            </div>
          ) : isSync ? (
            <div role="listbox" id={listboxId} aria-multiselectable>
              {orderedItems.length > 0 ? (
                <VirtualList
                  items={orderedItems}
                  rowHeight={rowHeight}
                  height={height}
                  renderRow={renderRow}
                  containerRef={virtualListContainerRef}
                />
              ) : null}
            </div>
          ) : (
            <div
              role="listbox"
              id={listboxId}
              aria-multiselectable
              style={{ overflowY: 'auto', height, position: 'relative' }}
              ref={scrollingContainerRef}
              onScroll={handleScroll}
            >
              <div style={{ position: 'relative' }}>
                {orderedItems.map((item, i) => renderRow(item, i, { minHeight: rowHeight }))}
              </div>
              {!loading && hasMore && orderedItems.length > 0 && (
                <div style={{ height: rowHeight }} className="ms-option" data-loading>
                  <span>Scroll for more</span>
                </div>
              )}
              {loading && (
                <div style={{ height: rowHeight }} className="ms-option" data-loading>
                  <span className="ms-spinner" aria-hidden="true"></span>
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
