import { useEffect, RefObject } from 'react';

interface UseScrollIntoViewOptions {
  activeIndex: number;
  isOpen: boolean;
  itemCount: number;
  isSync: boolean;
  rowHeight: number;
  listboxId: string;
  syncContainerRef: RefObject<HTMLDivElement>;
  asyncContainerRef: RefObject<HTMLDivElement>;
}

/**
 * Custom hook that scrolls the active option into view when navigating with keyboard.
 * Handles both sync mode (virtualized, fixed heights) and async mode (dynamic heights).
 */
export function useScrollIntoView({
  activeIndex,
  isOpen,
  itemCount,
  isSync,
  rowHeight,
  listboxId,
  syncContainerRef,
  asyncContainerRef,
}: UseScrollIntoViewOptions) {
  useEffect(() => {
    if (!isOpen || itemCount === 0 || activeIndex < 0) return;

    const container = isSync ? syncContainerRef.current : asyncContainerRef.current;
    if (!container) return;

    let optionTop: number;
    let optionHeight: number;

    if (isSync) {
      // Sync mode: Fixed row heights (no DOM lookup needed)
      optionTop = activeIndex * rowHeight;
      optionHeight = rowHeight;
    } else {
      // Async mode: Dynamic row heights - find element
      const optionElement = document.getElementById(`${listboxId}-option-${activeIndex}`);
      if (!optionElement) return;
      optionTop = optionElement.offsetTop;
      optionHeight = optionElement.offsetHeight || rowHeight;
    }

    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const optionBottom = optionTop + optionHeight;
    const viewportBottom = containerTop + containerHeight;

    // Scroll if option is outside viewport
    if (optionTop < containerTop) {
      container.scrollTop = optionTop;
    } else if (optionBottom > viewportBottom) {
      container.scrollTop = optionBottom - containerHeight;
    }
  }, [activeIndex, isOpen, isSync, itemCount, listboxId, rowHeight, syncContainerRef, asyncContainerRef]);
}

