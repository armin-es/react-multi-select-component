import type { Item } from '../../types';

interface TokenProps {
  item: Item;
  onRemove: (id: string) => void;
  onKeyDown: (id: string, e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Token component representing a selected item
 */
export function Token({ item, onRemove, onKeyDown }: TokenProps) {
  return (
    <button
      type="button"
      className="ms-token"
      aria-label={`Remove ${item.label}`}
      onClick={(e) => {
        e.stopPropagation();
        onRemove(item.id);
      }}
      onKeyDown={(e) => onKeyDown(item.id, e)}
    >
      <span>{item.label}</span>
      <span className="ms-token-x" aria-hidden>×</span>
    </button>
  );
}

