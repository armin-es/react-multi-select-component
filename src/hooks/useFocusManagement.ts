import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook for managing focus when opening/closing a dropdown.
 * Saves the previously focused element and restores it when closing.
 * 
 * @param isOpen - Whether the dropdown is open
 * @param inputRef - Ref to the input element that should receive focus when opening
 */
export function useFocusManagement(
  isOpen: boolean,
  inputRef: RefObject<HTMLInputElement>
) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      inputRef.current?.focus();
    } else {
      // Return focus to previous element when closing
      if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen, inputRef]);

  return previousActiveElementRef;
}

