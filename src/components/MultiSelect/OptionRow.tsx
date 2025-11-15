import type { CSSProperties } from 'react';
import type { OrderedItem } from '../../utils/ordering';

interface OptionRowProps {
  item: OrderedItem;
  index: number;
  style: CSSProperties;
  active: boolean;
  selected: boolean;
  listboxId: string;
  onMouseEnter: () => void;
  onSelect: (id: string) => void;
}

/**
 * Option row component for listbox items
 */
export function OptionRow({
  item,
  index,
  style,
  active,
  selected,
  listboxId,
  onMouseEnter,
  onSelect,
}: OptionRowProps) {
  const id = `${listboxId}-option-${index}`;
  const optionText = `${item.label}${item.group ? `, ${item.group}` : ''}${selected ? ', selected' : ''}`;

  return (
    <div
      key={item.id}
      id={id}
      role="option"
      aria-selected={selected}
      aria-label={optionText}
      data-active={active || undefined}
      data-selected={selected || undefined}
      className="ms-option"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(item.id);
      }}
    >
      <span className="ms-label">{item.label}</span>
      {selected ? <span className="ms-check" aria-hidden="true">✓</span> : null}
    </div>
  );
}

