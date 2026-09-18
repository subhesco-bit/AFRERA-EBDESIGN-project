import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import REOSDashboardPage from './REOSDashboardPage';
import { villageProfileAPI, procurementSubscriptionAPI } from '../services/api';

jest.mock('../services/api', () => ({
  villageProfileAPI: { searchVillages: jest.fn() },
  procurementSubscriptionAPI: { getStatistics: jest.fn() },
  buyingClubAPI: { getStatistics: jest.fn() },
  ruralEnterpriseAPI: { getStatistics: jest.fn() },
  renewableEnergyAPI: { getStatistics: jest.fn() },
  aiAdvisoryAPI: { getStatistics: jest.fn() },
}));

describe('village dashboard', () => {
  let client;
  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  });
  afterEach(() => client.clear());
  const mount = () => render(<QueryClientProvider client={client}><REOSDashboardPage /></QueryClientProvider>);

  test('renders canonical village fields and PostgreSQL numeric strings', async () => {
    villageProfileAPI.searchVillages.mockResolvedValue({ data: { data: [
      { id: 1, name: 'First village', district: 'District one', literacy_rate: '60.5', avg_income: '12500.00' },
      { id: 2, name: 'Second village', district: 'District two', literacy_rate: '80.5', avg_income: null },
    ] } });
    mount();
    expect(await screen.findByText('First village')).toBeInTheDocument();
    expect(screen.getByText('Second village')).toBeInTheDocument();
    expect(screen.getByText('₹12,500')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
    expect(procurementSubscriptionAPI.getStatistics).not.toHaveBeenCalled();
  });

  test('shows loading rather than fabricated zero statistics', () => {
    villageProfileAPI.searchVillages.mockReturnValue(new Promise(() => {}));
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading village profiles');
    expect(screen.queryByText('Villages Returned')).not.toBeInTheDocument();
  });

  test('displays a retryable error instead of treating failure as an empty village registry', async () => {
    villageProfileAPI.searchVillages.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: { data: [] } });
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No villages match your search.')).toBeInTheDocument();
  });

  test('rejects an unexpected API response shape', async () => {
    villageProfileAPI.searchVillages.mockResolvedValue({ data: { success: true, data: {} } });
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  });

  test('search updates the backend query parameters', async () => {
    villageProfileAPI.searchVillages.mockResolvedValue({ data: { data: [] } });
    mount();
    await screen.findByText('No villages match your search.');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search villages' }), { target: { value: 'rice' } });
    await waitFor(() => expect(villageProfileAPI.searchVillages).toHaveBeenLastCalledWith({ search: 'rice', limit: 100 }));
  });
});
