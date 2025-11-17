import { useCallback } from 'react';
import type { CSSProperties } from 'react';
import type React from 'react';
import type { OrderedItem } from '../utils/ordering';
import { OptionRow } from '../components/MultiSelect/OptionRow';

interface UseRenderRowOptions {
  activeIndex: number;
  selectedSet: Set<string>;
  listboxId: string;
  setActiveIndex: (index: number) => void;
  commitSelection: (id: string) => void;
}

/**
 * Custom hook for rendering rows in virtualized list (sync mode)
 * Returns a memoized render function that wraps OptionRow component
 * 
 * Note: Must be a hook to use useCallback for memoization, which is critical
 * for virtualization performance (prevents unnecessary re-renders)
 */
export function useRenderRow({
  activeIndex,
  selectedSet,
  listboxId,
  setActiveIndex,
  commitSelection,
}: UseRenderRowOptions): (item: OrderedItem, index: number, style: CSSProperties) => React.ReactElement {
  return useCallback(
    (item: OrderedItem, index: number, style: CSSProperties): React.ReactElement => (
      <OptionRow
        key={item.id}
        item={item}
        index={index}
        style={style}
        active={index === activeIndex}
        selected={selectedSet.has(item.id)}
        listboxId={listboxId}
        onMouseEnter={() => setActiveIndex(index)}
        onItemSelect={commitSelection}
      />
    ),
    [activeIndex, selectedSet, listboxId, setActiveIndex, commitSelection]
  );
}

