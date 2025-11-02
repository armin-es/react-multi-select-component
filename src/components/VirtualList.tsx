import { CSSProperties, useMemo, useRef } from 'react';
import { useLayoutEffect, useState } from 'react';

type VirtualListProps<T> = {
    items: T[];
    rowHeight: number;
    height: number;
    overscan?: number;
    renderRow: (item: T, index: number, style: CSSProperties) => JSX.Element;
    containerRef?: React.RefObject<HTMLDivElement>;
};

export function VirtualList<T>({ items, rowHeight, height, overscan = 6, renderRow, containerRef }: VirtualListProps<T>) {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const containerRefFinal = containerRef || internalRef;
    const [scrollTop, setScrollTop] = useState(0);

    useLayoutEffect(() => {
        const el = containerRefFinal.current;
        if (!el) return;
        const onScroll = () => setScrollTop(el.scrollTop);
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [containerRefFinal]);

    const total = items.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(total - 1, Math.ceil((scrollTop + height) / rowHeight) + overscan);
    const visibleItems = useMemo(() => items.slice(startIndex, endIndex + 1), [items, startIndex, endIndex]);

    const offsetY = startIndex * rowHeight;
    const contentHeight = total * rowHeight;

    return (
        <div ref={containerRefFinal} style={{ overflowY: 'auto', height, position: 'relative' }}>
            <div style={{ height: contentHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                    {visibleItems.map((item, i) => {
                        const index = startIndex + i;
                        const style: CSSProperties = { height: rowHeight };
                        return renderRow(item, index, style);
                    })}
                </div>
            </div>
        </div>
    );
}


