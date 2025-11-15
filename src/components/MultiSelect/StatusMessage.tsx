import { useMemo } from 'react';
import { SR_ONLY_STYLE } from './constants';

interface StatusMessageProps {
  loading: boolean;
  isAsync: boolean;
  open: boolean;
  itemCount: number;
  id: string;
}

/**
 * Status message component for screen reader announcements
 */
export function StatusMessage({
  loading,
  isAsync,
  open,
  itemCount,
  id,
}: StatusMessageProps) {
  const message = useMemo(() => {
    if (loading && isAsync) return 'Loading results';
    if (!loading && open && itemCount === 0) return 'No results found';
    if (!loading && open && itemCount > 0) {
      return `${itemCount} ${itemCount === 1 ? 'option' : 'options'} available`;
    }
    return '';
  }, [loading, isAsync, open, itemCount]);

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={SR_ONLY_STYLE}
    >
      {message}
    </div>
  );
}

