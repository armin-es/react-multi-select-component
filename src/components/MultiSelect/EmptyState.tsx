interface EmptyStateProps {
  loading: boolean;
  listboxId: string;
}

/**
 * Empty state component for loading and no results states
 */
export function EmptyState({ loading, listboxId }: EmptyStateProps) {
  return (
    <div role="listbox" id={listboxId} aria-multiselectable>
      <div className="ms-empty">
        {loading ? (
          <>
            <span className="ms-spinner" aria-hidden="true"></span>
            <span>Loading results...</span>
          </>
        ) : (
          <span>No results found</span>
        )}
      </div>
    </div>
  );
}

