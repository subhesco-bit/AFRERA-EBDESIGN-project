import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdvancedSearchPage from '../pages/AdvancedSearchPage';
import KnowledgeBasePage from '../pages/KnowledgeBasePage';
import { knowledgeGraphAPI, libraryAPI, searchAPI } from '../services/api';

jest.mock('../services/api', () => ({
  searchAPI: { search: jest.fn() },
  libraryAPI: { search: jest.fn() },
  knowledgeGraphAPI: { searchNodes: jest.fn() },
}));

describe('search and knowledge pages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches with the selected type and renders real results', async () => {
    searchAPI.search.mockResolvedValue({ data: { results: [{ id: 'p1', name: 'Rice', type: 'product' }] } });
    render(<AdvancedSearchPage />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'rice' } });
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'product' } });
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
    await waitFor(() => expect(searchAPI.search).toHaveBeenCalledWith({ query: 'rice', type: 'product', page: 1, limit: 20 }));
    expect(await screen.findByText('Rice')).toBeInTheDocument();
  });

  it('reports a knowledge search error without fabricating entries', async () => {
    libraryAPI.search.mockRejectedValue(new Error('Library unavailable'));
    knowledgeGraphAPI.searchNodes.mockResolvedValue({ data: [] });
    render(<KnowledgeBasePage />);
    fireEvent.change(screen.getByLabelText('Search knowledge base'), { target: { value: 'soil health' } });
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Library unavailable');
    expect(screen.queryByText(/Indexed knowledge entry/)).not.toBeInTheDocument();
  });
});