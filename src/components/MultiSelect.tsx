import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, CSSProperties } from 'react';
import { VirtualList } from './VirtualList';
import { orderItemsSync, orderItemsAsync } from '../utils/ordering';
import type { Item, MultiSelectProps } from '../types';
import type { OrderedItem } from '../utils/ordering';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [mruOrder, setMruOrder] = useState<string[]>([]);

  // Async state
  const [asyncItems, setAsyncItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Cache of selected items for token display (persists across searches)
  const [selectedItemsCache, setSelectedItemsCache] = useState<Map<string, Item>>(new Map());

  const inputRef = useRef<HTMLInputElement | null>(null);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const scrollingContainerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Async refs
  const pageRef = useRef(0);
  const queryRef = useRef(query);
  const debounceTimerRef = useRef<number | null>(null);
  const fetchItemsRef = useRef(fetchItems);
  const loadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const comboId = useId();
  const listboxId = `${comboId}-listbox`;

  // Keep fetchItems ref updated
  useEffect(() => {
    if (fetchItems) fetchItemsRef.current = fetchItems;
  }, [fetchItems]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Determine items to use
  const allItems = isSync ? items : asyncItems;

  const orderedItems = useMemo(() => {
    if (isSync && items) {
      return orderItemsSync(items, selectedIds, query, mruOrder);
    }
    return orderItemsAsync(asyncItems, selectedIds, mruOrder);
  }, [isSync, items, asyncItems, selectedIds, query, mruOrder]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const height = visibleRows * rowHeight;

  const commitSelection = useCallback((id: string) => {
    const isRemoving = selectedSet.has(id);
    const next = isRemoving ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onChange(next);
    setMruOrder(prev => {
      const filtered = prev.filter(x => x !== id);
      return [id, ...filtered];
    });
    // Update selected items cache
    if (isAsync) {
      setSelectedItemsCache(prev => {
        const nextCache = new Map(prev);
        if (isRemoving) {
          nextCache.delete(id);
        } else {
          // Try to find the item in current asyncItems first, otherwise keep existing cache entry
          const item = asyncItems.find(i => i.id === id);
          if (item) {
            nextCache.set(id, item);
          }
        }
        return nextCache;
      });
    }
    // Clear search query after selection so user can easily search for next item
    setQuery('');
    // Reset active index to top of list for next search
    setActiveIndex(0);
  }, [onChange, selectedIds, selectedSet, isAsync, asyncItems]);

  const clearAll = useCallback(() => {
    onChange([]);
    if (isAsync) {
      setSelectedItemsCache(new Map());
    }
  }, [onChange, isAsync]);

  // Async: Load more items
  const loadMore = useCallback(async (reset = false) => {
    if (!fetchItemsRef.current || loadingRef.current) return;

    if (reset) {
      pageRef.current = 0;
      setAsyncItems([]);
      setHasMore(true);
    }

    setLoading(true);
    try {
      const fetched = await fetchItemsRef.current(queryRef.current, pageRef.current);
      setAsyncItems(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore(fetched.length >= pageSize);
      // Update cache with any newly fetched selected items
      setSelectedItemsCache(prev => {
        const nextCache = new Map(prev);
        fetched.forEach(item => {
          if (selectedSet.has(item.id)) {
            nextCache.set(item.id, item);
          }
        });
        return nextCache;
      });
      pageRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [pageSize, selectedSet]);

  // Async: Debounced search
  useEffect(() => {
    if (!isAsync) return;

    queryRef.current = query;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const delay = initialLoadDoneRef.current ? searchDelay : 0;
    debounceTimerRef.current = window.setTimeout(() => {
      initialLoadDoneRef.current = true;
      loadMore(true);
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isAsync, searchDelay]);

  // Async: Initial load
  useEffect(() => {
    if (isAsync && !initialLoadDoneRef.current) {
      loadMore(true);
    }
  }, [isAsync, loadMore]);

  // Async: Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isAsync) return;

    const target = e.currentTarget;
    const threshold = 100;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

    if (nearBottom && hasMore && !loadingRef.current) {
      loadMore(false);
    }
  }, [isAsync, hasMore, loadMore]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, orderedItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(Math.max(0, orderedItems.length - 1));
        break;
      case 'Enter': {
        e.preventDefault();
        const active = orderedItems[activeIndex];
        if (active) commitSelection(active.id);
        break;
      }
      case ' ': {
        // Only select on space if the input is empty (user is navigating, not typing)
        // If there's text in the input, allow space to be typed
        if (!query.trim()) {
          e.preventDefault();
          const active = orderedItems[activeIndex];
          if (active) commitSelection(active.id);
        }
        // Otherwise, let the space character be entered into the input
        break;
      }
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Backspace':
        if (!query && selectedIds.length) {
          e.preventDefault();
          const last = selectedIds[selectedIds.length - 1];
          if (last) {
            onChange(selectedIds.slice(0, -1));
            setMruOrder(prev => [last, ...prev.filter(x => x !== last)]);
          }
        }
        break;
      default:
        break;
    }
  }, [open, orderedItems, activeIndex, commitSelection, query, selectedIds, onChange]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      inputRef.current?.focus();
    } else {
      // Return focus to previous element when closing (e.g., after Escape)
      if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (comboboxRef.current && !comboboxRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
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
