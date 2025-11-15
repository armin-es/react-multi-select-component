import { useCallback } from 'react';

interface ClearButtonProps {
  onClear: () => void;
}

/**
 * Clear button component for removing all selected items
 */
export function ClearButton({ onClear }: ClearButtonProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onClear();
    }
    // Allow Escape to propagate to combobox handler to close dropdown
  }, [onClear]);

  return (
    <button
      type="button"
      className="ms-clear"
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      onKeyDown={handleKeyDown}
      aria-label="Clear selected"
    >
      Clear
    </button>
  );
}

