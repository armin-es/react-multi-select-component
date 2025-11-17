interface EmptyStateProps {
  loading: boolean;
  error: Error | null;
  onRetry?: () => void;
  listboxId: string;
}

/**
 * Empty state component for loading, error, and no results states
 */
export function EmptyState({ loading, error, onRetry, listboxId }: EmptyStateProps) {
  return (
    <div role="listbox" id={listboxId} aria-multiselectable>
      <div className="ms-empty">
        {loading ? (
          <>
            <span className="ms-spinner" aria-hidden="true"></span>
            <span>Loading results...</span>
          </>
        ) : error ? (
          <>
            <span>Error: {error.message}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ms-retry"
                aria-label="Retry loading items"
              >
                Retry
              </button>
            )}
          </>
        ) : (
          <span>No results found</span>
        )}
      </div>
    </div>
  );
}

