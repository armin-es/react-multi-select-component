import { useCallback } from 'react';
import type { Item } from '../../types';
import { focusTokenButton } from './utils';

interface UseTokenNavigationOptions {
  selectedIds: string[];
  getSelectedItem: (id: string) => Item | undefined;
  commitSelection: (id: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Custom hook for handling keyboard navigation on token buttons
 */
export function useTokenNavigation({
  selectedIds,
  getSelectedItem,
  commitSelection,
  inputRef,
}: UseTokenNavigationOptions) {
  // Helper to focus a token by ID, or input if not found
  const focusTokenById = useCallback((tokenId: string | null) => {
    if (!tokenId) {
      inputRef.current?.focus();
      return;
    }
    const item = getSelectedItem(tokenId);
    if (item?.label) {
      focusTokenButton(item.label);
    } else {
      inputRef.current?.focus();
    }
  }, [getSelectedItem, inputRef]);

  const handleTokenKeyDown = useCallback((id: string, e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = selectedIds.indexOf(id);

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      e.stopPropagation();

      // Find next/prev token IDs (before removal)
      const nextId = currentIndex < selectedIds.length - 1 ? selectedIds[currentIndex + 1] : null;
      const prevId = currentIndex > 0 ? selectedIds[currentIndex - 1] : null;

      commitSelection(id);

      // After removal, focus the next token, previous token, or input
      requestAnimationFrame(() => {
        focusTokenById(nextId ?? prevId);
      });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      const prevId = currentIndex > 0 ? selectedIds[currentIndex - 1] : null;
      focusTokenById(prevId);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      const nextId = currentIndex < selectedIds.length - 1 ? selectedIds[currentIndex + 1] : null;
      focusTokenById(nextId);
    }
  }, [selectedIds, commitSelection, focusTokenById]);

  return { handleTokenKeyDown };
}

