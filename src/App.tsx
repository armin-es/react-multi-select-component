import { useState } from 'react';
import MultiSelect from './components/MultiSelect';
import { fetchItems, generateDataset } from './utils/data';
import type { Item } from './types';

export default function App() {
    // Async mode - paginated backend simulation
    const [selectedAsync, setSelectedAsync] = useState<string[]>([]);

    // Sync mode - in-memory dataset
    const syncItems = generateDataset(500);
    const [selectedSync, setSelectedSync] = useState<string[]>([]);

    // Many selections demo
    const manyItems = generateDataset(200);
    const [selectedMany, setSelectedMany] = useState<string[]>(
        Array.from({ length: 15 }, (_, i) => String(i + 1))
    );

    // Edge case: very long labels
    const longLabelItems: Item[] = [
        { id: '1', label: 'This is a very long label that demonstrates how the component handles text overflow gracefully', group: 'Long Labels' },
        { id: '2', label: 'Another extremely long item name that might wrap or truncate depending on styling', group: 'Long Labels' },
        { id: '3', label: 'Short', group: 'Mixed' },
        { id: '4', label: 'Medium length item name here', group: 'Mixed' },
        { id: '5', label: 'Yet another item with a description that goes on and on', group: 'Mixed' },
    ];
    const [selectedLong, setSelectedLong] = useState<string[]>([]);

    // Minimal dataset
    const minimalItems: Item[] = [
        { id: '1', label: 'Apple', group: 'Fruit' },
        { id: '2', label: 'Banana', group: 'Fruit' },
        { id: '3', label: 'Carrot', group: 'Vegetable' },
        { id: '4', label: 'Date', group: 'Fruit' },
    ];
    const [selectedMinimal, setSelectedMinimal] = useState<string[]>([]);

    return (
        <div style={{ padding: 24, display: 'grid', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
            <header>
                <h1 style={{ margin: 0, fontSize: 28 }}>Deck Multi‑Select</h1>
                <p style={{ margin: '8px 0 0', color: '#9fb2ff', fontSize: 14 }}>
                    A performant, accessible multi-select dropdown with support for large datasets.
                </p>
            </header>

            {/* Async Mode - Paginated Backend */}
            <section>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Async Mode — Paginated Backend</h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                    Simulates server-side pagination with 10,000 items. Loads on search (debounced 300ms) and scroll.
                </p>
                <MultiSelect
                    fetchItems={fetchItems}
                    selectedIds={selectedAsync}
                    onChange={setSelectedAsync}
                    placeholder="Search 10k items..."
                    label="Select items (async)"
                    visibleRows={10}
                    rowHeight={36}
                    searchDelay={300}
                    pageSize={50}
                />
                {selectedAsync.length > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6aa0ff' }}>
                        {selectedAsync.length} item{selectedAsync.length !== 1 ? 's' : ''} selected
                    </p>
                )}
            </section>

            {/* Sync Mode - In-Memory */}
            <section>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Sync Mode — In-Memory Filtering</h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                    Client-side fuzzy search with 500 items. Instant filtering, virtualized scrolling.
                </p>
                <MultiSelect
                    items={syncItems}
                    selectedIds={selectedSync}
                    onChange={setSelectedSync}
                    placeholder="Search with fuzzy matching..."
                    label="Select items (sync)"
                    visibleRows={8}
                    rowHeight={36}
                />
            </section>

            {/* Many Selections */}
            <section>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Many Selections</h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                    Pre-selected items demonstrate token management and MRU ordering.
                </p>
                <MultiSelect
                    items={manyItems}
                    selectedIds={selectedMany}
                    onChange={setSelectedMany}
                    placeholder="Add more items..."
                    label="Select items"
                    visibleRows={6}
                    rowHeight={36}
                />
            </section>

            {/* Edge Cases */}
            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Long Labels</h2>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                        Tests text overflow and wrapping behavior.
                    </p>
                    <MultiSelect
                        items={longLabelItems}
                        selectedIds={selectedLong}
                        onChange={setSelectedLong}
                        placeholder="Search items..."
                        label="Long labels"
                        visibleRows={5}
                        rowHeight={36}
                    />
                </div>

                <div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Minimal Dataset</h2>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                        Small dataset with just 4 items.
                    </p>
                    <MultiSelect
                        items={minimalItems}
                        selectedIds={selectedMinimal}
                        onChange={setSelectedMinimal}
                        placeholder="Choose..."
                        label="Minimal"
                        visibleRows={5}
                        rowHeight={36}
                    />
                </div>
            </section>

            {/* Disabled State */}
            <section>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#9fb2ff' }}>Disabled State</h2>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9fb2ff' }}>
                    Component in disabled state with pre-selected items.
                </p>
                <MultiSelect
                    items={minimalItems}
                    selectedIds={['1', '3']}
                    onChange={() => { }}
                    placeholder="Disabled..."
                    label="Disabled example"
                    disabled
                    visibleRows={5}
                    rowHeight={36}
                />
            </section>

            {/* Features Showcase */}
            <section style={{ marginTop: 16 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#9fb2ff' }}>Features</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, fontSize: 13 }}>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ Keyboard Navigation</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Arrow keys, Enter, Space, Escape, Home, End</p>
                    </div>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ Fuzzy Search</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Lightweight client-side matching (sync mode)</p>
                    </div>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ Virtualization</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Smooth scrolling for 10k+ items</p>
                    </div>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ Accessible</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Full WAI-ARIA support</p>
                    </div>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ MRU Ordering</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Recently used items pinned to top</p>
                    </div>
                    <div>
                        <strong style={{ color: '#6aa0ff' }}>✓ Dual Mode</strong>
                        <p style={{ margin: '4px 0 0', color: '#9fb2ff' }}>Sync (in-memory) or Async (paginated)</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
