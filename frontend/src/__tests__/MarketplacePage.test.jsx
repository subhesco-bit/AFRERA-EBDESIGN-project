import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MarketplacePage from '../pages/MarketplacePage';
import * as rq from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async (importActual) => ({
  ...(await importActual()),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe('MarketplacePage', () => {
  it('renders product cards from API', async () => {
    const mockData = {
      products: [
        { id: 'p1', name: 'Test Grain', base_price: 100, unit_symbol: 'kg', category_name: 'Grains', state_name: 'Assam' },
      ],
      pagination: { total: 1, totalPages: 1 },
    };

    rq.useQuery.mockImplementation(() => ({ data: mockData, isLoading: false, error: null }));

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>);

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Test Grain')).toBeInTheDocument();
  });
});
