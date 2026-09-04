import { render, screen, waitFor } from '@testing-library/react';
import MarketplacePage from '../pages/MarketplacePage';
import * as api from '../services/api';
import * as rq from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
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

    render(<MarketplacePage />);

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Test Grain')).toBeInTheDocument();
  });
});
