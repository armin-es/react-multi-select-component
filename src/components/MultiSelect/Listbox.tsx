import { VirtualList } from '../VirtualList';
import type { OrderedItem } from '../../utils/ordering';
import type { CSSProperties } from 'react';
import { EmptyState } from './EmptyState';
import { OptionRow } from './OptionRow';

interface ListboxProps {
    isSync: boolean;
    orderedItems: OrderedItem[];
    loading: boolean;
    hasMore: boolean;
    error: Error | null;
    onRetry?: () => void;
    listboxId: string;
    activeIndex: number;
    selectedSet: Set<string>;
    rowHeight: number;
    height: number;
    renderRow?: (item: OrderedItem, index: number, style: CSSProperties) => React.ReactElement;
    containerRef: React.RefObject<HTMLDivElement>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    onMouseEnter: (index: number) => void;
    onSelect: (id: string) => void;
}

/**
 * Listbox component that handles both sync (virtualized) and async (scroll) modes
 */
export function Listbox({
    isSync,
    orderedItems,
    loading,
    hasMore,
    error,
    onRetry,
    listboxId,
    activeIndex,
    selectedSet,
    rowHeight,
    height,
    renderRow,
    containerRef,
    onScroll,
    onMouseEnter,
    onSelect,
}: ListboxProps) {
    if (loading && orderedItems.length === 0) {
        return <EmptyState loading={true} error={null} listboxId={listboxId} />;
    }

    if (error && orderedItems.length === 0) {
        return <EmptyState loading={false} error={error} onRetry={onRetry} listboxId={listboxId} />;
    }

    if (orderedItems.length === 0) {
        return <EmptyState loading={false} error={null} listboxId={listboxId} />;
    }

    if (isSync) {
        return (
            <div role="listbox" id={listboxId} aria-multiselectable>
                {renderRow && (
                    <VirtualList
                        items={orderedItems}
                        rowHeight={rowHeight}
                        height={height}
                        renderRow={renderRow}
                        containerRef={containerRef}
                    />
                )}
            </div>
        );
    }

    // Async mode
    return (
        <div
            role="listbox"
            id={listboxId}
            aria-multiselectable
            style={{ overflowY: 'auto', height, position: 'relative' }}
            ref={containerRef}
            onScroll={onScroll}
        >
            <div style={{ position: 'relative' }}>
                {orderedItems.map((item, i) => (
                    <OptionRow
                        key={item.id}
                        item={item}
                        index={i}
                        style={{ minHeight: rowHeight }}
                        active={i === activeIndex}
                        selected={selectedSet.has(item.id)}
                        listboxId={listboxId}
                        onMouseEnter={() => onMouseEnter(i)}
                        onSelect={onSelect}
                    />
                ))}
            </div>
            {!loading && hasMore && orderedItems.length > 0 && (
                <div style={{ height: rowHeight }} className="ms-option" data-loading>
                    <span>Scroll for more</span>
                </div>
            )}
            {loading && (
                <div style={{ height: rowHeight }} className="ms-option" data-loading>
                    <span className="ms-spinner" aria-hidden="true"></span>
                    <span>Loading more...</span>
                </div>
            )}
        </div>
    );
}

