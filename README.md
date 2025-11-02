# Deck Multi‑Select

React + TypeScript implementation of a reusable, performant, accessible multi‑select dropdown designed for 10k+ items.

## Run

Install deps: `npm i`  
Dev: `npm run dev`  
Build: `npm run build && npm run preview`  
Test: `npm test`

## Design & Reasoning

**Ordering**: Selected items pinned to top (MRU order). Unselected items filtered by lightweight fuzzy search (subsequence matching with prefix/word boundary bonuses). Logic separated into `src/utils/ordering.ts` for testability.

**Keyboard Navigation**: Fully keyboard accessible. Dropdown: ArrowUp/Down navigate, Home/End jump to first/last, Enter/Space select, Escape closes. Space only selects when input is empty (allows searching items with spaces). Tokens: ArrowLeft/Right navigate, Backspace/Delete remove focused token, Tab/Shift+Tab standard navigation. Input: Backspace removes last token when query empty. Focus returns to previous element on close.

**Performance**: Async mode uses paginated loading (50/page) with debounced search (300ms) and infinite scroll. Sync mode includes virtualization for large datasets. Memoization stabilizes derived arrays. Fixed row height enables efficient layout. No heavy dependencies — custom lightweight implementations.

**Accessibility**: WAI‑ARIA compliant with `combobox`, `listbox`, `option` roles. States: `aria-expanded`, `aria-selected`, `aria-multiselectable`, `aria-activedescendant`, `aria-busy`. Live regions announce loading, result counts, empty states. All interactive elements have accessible labels. Focus management ensures screen reader context.

**UX**: Visual loading spinner, empty state messaging, smooth dropdown transitions, text wrapping (2 lines max), query clears after selection.

**Future improvements**: Visual group headers with sticky positioning (data supports groups but not visually rendered), advanced fuzzy search with typo tolerance and multi-field weighting, virtual scrolling for async mode, selection limits and disabled items, comprehensive a11y audit against WAI-ARIA combobox pattern.

## API Usage

**Sync Mode** (in-memory):

```tsx
<MultiSelect
  items={allItems}
  selectedIds={selected}
  onChange={setSelected}
/>
```

**Async Mode** (paginated):

```tsx
<MultiSelect
  fetchItems={async (query, page) => {
    return await fetch(`/api/items?q=${query}&page=${page}`).then(r => r.json());
  }}
  selectedIds={selected}
  onChange={setSelected}
  searchDelay={300}  // optional
  pageSize={50}       // optional
/>
```

## Structure

- `src/components/MultiSelect.tsx`: Unified component (sync + async modes)
- `src/components/VirtualList.tsx`: Virtualization for sync mode
- `src/utils/fuzzy.ts`: Fuzzy matching algorithm
- `src/utils/ordering.ts`: MRU + filtering logic
- `src/utils/data.ts`: Demo utilities
- `src/App.tsx`: Enhanced demo with multiple scenarios

## Testing

39 tests covering fuzzy logic (11), ordering (8), and component functionality (20) including keyboard navigation, selection behavior, and accessibility.
