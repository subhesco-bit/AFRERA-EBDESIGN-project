import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandRecordsPage from '../pages/LandRecordsPage';
import AIApprovalPage from '../pages/AIApprovalPage';
import { landRecordsAPI, aiApprovalAPI } from '../services/api';

jest.mock('../services/api', () => ({
  landRecordsAPI: {
    getMyRecords: jest.fn(),
    addRecord: jest.fn(),
    syncWithGovernment: jest.fn(),
  },
  aiApprovalAPI: {
    getProposals: jest.fn(),
    createProposal: jest.fn(),
  },
}));

function withClient(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

test('LandRecordsPage renders real data without crashing', async () => {
  landRecordsAPI.getMyRecords.mockResolvedValue({
    data: { data: { records: [{ id: 1, survey_number: 'S1', village: 'V', district: 'D', state: 'ST', area_in_hectares: 2, area_in_acres: 5, ownership_type: 'owned', land_use_type: 'crop', verification_status: 'pending' }], totals: { total_plots: 1, total_hectares: 2 }, pagination: { page: 1, limit: 20 } } },
  });
  render(withClient(<LandRecordsPage />));
  expect(await screen.findByText(/Survey S1/)).toBeInTheDocument();
});

test('AIApprovalPage renders real data without crashing', async () => {
  aiApprovalAPI.getProposals.mockResolvedValue({
    data: { data: [{ id: 'p1', proposal_type: 'price_change', domain: 'pricing', status: 'proposed', rationale: 'test' }] },
  });
  render(withClient(<AIApprovalPage />));
  expect(await screen.findByText(/price_change/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
});
