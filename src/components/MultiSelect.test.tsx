import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiSelect from './MultiSelect';
import type { Item } from '../types';

const mockItems: Item[] = [
  { id: '1', label: 'Alpha', group: 'Provider' },
  { id: '2', label: 'Beta', group: 'Account' },
  { id: '3', label: 'Gamma', group: 'Tag' },
];

describe('MultiSelect', () => {
  const defaultProps = {
    items: mockItems,
    selectedIds: [] as string[],
    onChange: vi.fn(),
    label: 'Select items',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<MultiSelect {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders label and placeholder', () => {
      render(<MultiSelect {...defaultProps} placeholder="Search..." />);
      expect(screen.getByText('Select items')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('displays selected items as tokens', () => {
      render(<MultiSelect {...defaultProps} selectedIds={['1', '2']} />);
      expect(screen.getByLabelText('Remove Alpha')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown on input focus', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('displays items in dropdown', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        expect(options.length).toBe(3);
      });
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters items based on search query', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      await user.clear(input);
      await user.type(input, 'al');
      
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        const texts = options.map(o => o.textContent);
        expect(texts.some(t => t?.includes('Alpha'))).toBe(true);
        expect(texts.some(t => t?.includes('Beta'))).toBe(false);
      });
    });

    it('allows space to be typed in search input', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items') as HTMLInputElement;
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Type text with spaces
      await user.type(input, 'hello world');
      
      await waitFor(() => {
        expect(input.value).toBe('hello world');
      });
    });

    it('selects item with space when input is empty', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={onChange} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Space should select when input is empty (activeIndex is 0, which is Alpha, id '1')
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['1']);
      });
    });
  });

  describe('Selection', () => {
    it('selects item on click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={onChange} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      const alphaOption = options.find(opt => {
        const label = opt.querySelector('.ms-label');
        return label?.textContent === 'Alpha';
      });
      
      expect(alphaOption).toBeDefined();
      if (alphaOption) {
        fireEvent.mouseDown(alphaOption);
        
        await waitFor(() => {
          expect(onChange).toHaveBeenCalledWith(['1']);
        }, { timeout: 1000 });
      }
    });

    it('removes token on click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} selectedIds={['1']} onChange={onChange} />);
      
      const removeButton = screen.getByLabelText('Remove Alpha');
      await user.click(removeButton);
      
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('clears all selections', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} selectedIds={['1', '2']} onChange={onChange} />);
      
      const clearButton = screen.getByLabelText('Clear selected');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      render(<MultiSelect {...defaultProps} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Initial state: first item (index 0) should be active
      let options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('data-active', 'true');
      
      // Press ArrowDown to move to second item (index 1)
      await user.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        options = screen.getAllByRole('option');
        expect(options[1]).toHaveAttribute('data-active', 'true');
        expect(options[0]).not.toHaveAttribute('data-active');
      });
    });

    it('selects item with Enter key and clears query', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} onChange={onChange} />);
      const input = screen.getByLabelText('Select items') as HTMLInputElement;
      
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Type a search query
      await user.type(input, 'al');
      expect(input.value).toBe('al');
      
      // Initially activeIndex is 0 (first item: Alpha, id '1')
      // Press Enter to select the first item
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['1']);
        // Query should be cleared after selection
        expect(input.value).toBe('');
      });
    });

    it('removes last token on Backspace', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MultiSelect {...defaultProps} selectedIds={['1', '2']} onChange={onChange} />);
      const input = screen.getByLabelText('Select items');
      
      await user.click(input);
      // Ensure input is focused and empty
      await user.keyboard('{Backspace}');
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(['1']);
      }, { timeout: 1000 });
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<MultiSelect {...defaultProps} disabled />);
      const input = screen.getByLabelText('Select items');
      expect(input).toBeDisabled();
    });
  });
});

describe('MultiSelect - Async Mode', () => {
  const mockFetchItems = vi.fn(async (query: string, page: number): Promise<Item[]> => {
    await new Promise(resolve => setTimeout(resolve, 10));
    const filtered = mockItems.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    const start = page * 2;
    return filtered.slice(start, start + 2);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads items on mount', async () => {
    render(
      <MultiSelect
        fetchItems={mockFetchItems}
        selectedIds={[]}
        onChange={vi.fn()}
        label="Select items"
      />
    );
    
    await waitFor(() => {
      expect(mockFetchItems).toHaveBeenCalledWith('', 0);
    }, { timeout: 2000 });
  });

  it('shows loading state during fetch', async () => {
    let resolveFetch: (() => void) | undefined;
    const slowFetch = vi.fn(async () => {
      await new Promise<void>(resolve => {
        resolveFetch = resolve;
      });
      return mockItems;
    });

    const user = userEvent.setup();
    render(
      <MultiSelect
        fetchItems={slowFetch}
        selectedIds={[]}
        onChange={vi.fn()}
        label="Select items"
      />
    );
    
    const input = screen.getByLabelText('Select items');
    await user.click(input);
    
    await waitFor(() => {
      const status = screen.queryByRole('status');
      expect(status).toBeInTheDocument();
    });
    
    if (resolveFetch) {
      resolveFetch();
    }
  });
});

describe('MultiSelect - Accessibility', () => {
  it('has proper ARIA attributes', () => {
    render(<MultiSelect items={mockItems} selectedIds={[]} onChange={vi.fn()} label="Select items" />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when open', async () => {
    const user = userEvent.setup();
    render(<MultiSelect items={mockItems} selectedIds={[]} onChange={vi.fn()} label="Select items" />);
    const combobox = screen.getByRole('combobox');
    const input = screen.getByLabelText('Select items');
    
    await user.click(input);
    
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('announces status changes', async () => {
    const user = userEvent.setup();
    render(<MultiSelect items={mockItems} selectedIds={[]} onChange={vi.fn()} label="Select items" />);
    const input = screen.getByLabelText('Select items');
    
    await user.click(input);
    
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status.textContent).toMatch(/option/i);
    });
  });
});
