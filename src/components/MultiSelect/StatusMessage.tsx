import { useMemo } from 'react';
import { SR_ONLY_STYLE } from './constants';

interface StatusMessageProps {
  loading: boolean;
  isAsync: boolean;
  open: boolean;
  itemCount: number;
  error: Error | null;
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
  error,
  id,
}: StatusMessageProps) {
  const message = useMemo(() => {
    if (error) return `Error loading results: ${error.message}`;
    if (loading && isAsync) return 'Loading results';
    if (!loading && open && itemCount === 0) return 'No results found';
    if (!loading && open && itemCount > 0) {
      return `${itemCount} ${itemCount === 1 ? 'option' : 'options'} available`;
    }
    return '';
  }, [loading, isAsync, open, itemCount, error]);

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

