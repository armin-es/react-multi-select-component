import { useEffect, RefObject } from 'react';

/**
 * Custom hook that detects clicks outside of a referenced element.
 * Useful for closing dropdowns, modals, or other UI elements when clicking outside.
 * 
 * @param ref - React ref to the element to detect clicks outside of
 * @param handler - Callback function to execute when click outside is detected
 * @param enabled - Whether the click outside detection is enabled (default: true)
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler, enabled]);
}

