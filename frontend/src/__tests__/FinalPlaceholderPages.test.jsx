import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityForumPage from '../pages/CommunityForumPage';
import ExportDocumentationPage from '../pages/ExportDocumentationPage';
import SupportCenterPage from '../pages/SupportCenterPage';
import SustainabilityDashboardPage from '../pages/SustainabilityDashboardPage';
import { farmerTrainingAPI, formsAPI, foluAPI, erpAPI, knowledgeGraphAPI, libraryAPI } from '../services/api';

jest.mock('../services/api', () => ({
  farmerTrainingAPI: { getCarbonFootprint: jest.fn() },
  formsAPI: { createForm: jest.fn(), submitForm: jest.fn() },
  foluAPI: { landUseSummary: jest.fn() },
  erpAPI: { getSyncStatus: jest.fn() },
  knowledgeGraphAPI: { searchNodes: jest.fn() },
  libraryAPI: { search: jest.fn() },
}));

describe('final placeholder page replacements', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches verified community knowledge sources and renders results', async () => {
    libraryAPI.search.mockResolvedValue({ data: { results: [{ id: 'l1', title: 'Soil guide' }] } });
    knowledgeGraphAPI.searchNodes.mockResolvedValue({ data: [{ id: 'g1', name: 'Compost' }] });
    render(<CommunityForumPage />);
    fireEvent.change(screen.getByLabelText('Search community knowledge'), { target: { value: 'soil' } });
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
    await waitFor(() => expect(libraryAPI.search).toHaveBeenCalledWith({ query: 'soil' }));
    expect(knowledgeGraphAPI.searchNodes).toHaveBeenCalledWith('soil');
    expect(await screen.findByText('Soil guide')).toBeInTheDocument();
    expect(screen.getByText('Compost')).toBeInTheDocument();
  });

  it('reports ERP status and exposes an honest empty state', async () => {
    erpAPI.getSyncStatus.mockResolvedValue({ data: null });
    render(<ExportDocumentationPage />);
    await waitFor(() => expect(erpAPI.getSyncStatus).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('No ERP status was returned.')).toBeInTheDocument();
    expect(screen.getByText(/No export-document generation client is available/)).toBeInTheDocument();
  });

  it('submits support requests through the forms service', async () => {
    formsAPI.createForm.mockResolvedValue({ data: { id: 'support-form' } });
    formsAPI.submitForm.mockResolvedValue({ data: { accepted: true } });
    render(<SupportCenterPage />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Asha' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@example.com' } });
    fireEvent.change(screen.getByLabelText('How can we help?'), { target: { value: 'Need help' } });
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => expect(formsAPI.createForm).toHaveBeenCalledWith({ name: 'Support request', description: 'Support request form' }));
    expect(formsAPI.submitForm).toHaveBeenCalledWith('support-form', { name: 'Asha', email: 'asha@example.com', message: 'Need help' });
    expect(await screen.findByRole('status')).toHaveTextContent(/submitted through the forms service/i);
  });

  it('loads FOLU and training carbon metrics for a farmer', async () => {
    foluAPI.landUseSummary.mockResolvedValue({ data: { hectares: 4 } });
    farmerTrainingAPI.getCarbonFootprint.mockResolvedValue({ data: { total: 12 } });
    render(<SustainabilityDashboardPage />);
    fireEvent.change(screen.getByLabelText('Farmer ID'), { target: { value: 'farmer-7' } });
    fireEvent.click(screen.getByRole('button', { name: /load metrics/i }));
    await waitFor(() => expect(foluAPI.landUseSummary).toHaveBeenCalledWith({ farmer_id: 'farmer-7' }));
    expect(farmerTrainingAPI.getCarbonFootprint).toHaveBeenCalledWith('farmer-7');
    expect(await screen.findByText('FOLU land-use summary')).toBeInTheDocument();
    expect(screen.getByText('Carbon footprint')).toBeInTheDocument();
  });
});
