import { useCallback, useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { OrderedItem } from '../utils/ordering';

interface UseKeyboardNavigationOptions {
  open: boolean;
  setOpen: (open: boolean) => void;
  orderedItems: OrderedItem[];
  selectedIds: string[];
  query: string;
  commitSelection: (id: string) => void;
  onChange: (ids: string[]) => void;
  setMruOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

interface UseKeyboardNavigationReturn {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  onKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Custom hook for handling keyboard navigation in a multi-select dropdown.
 * Supports Arrow keys, Enter, Space, Escape, Home, End, and Backspace.
 */
export function useKeyboardNavigation({
  open,
  setOpen,
  orderedItems,
  selectedIds,
  query,
  commitSelection,
  onChange,
  setMruOrder,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [activeIndex, setActiveIndex] = useState(0);

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
        if (!query.trim()) {
          e.preventDefault();
          const active = orderedItems[activeIndex];
          if (active) commitSelection(active.id);
        }
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
  }, [open, setOpen, orderedItems, activeIndex, commitSelection, query, selectedIds, onChange, setMruOrder]);

  // Reset active index when query changes or dropdown opens
  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [query, open]);

  return {
    activeIndex,
    setActiveIndex,
    onKeyDown,
  };
}

