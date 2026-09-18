import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import api from '../../services/componentApi';

jest.mock('../../services/componentApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

describe('AIChat governed provider integration', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends the selected domain and renders real provider output', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        content: 'Grounded provider response',
        provider: 'openai',
        model: 'configured-model',
        provenance: { libraryMatches: [] },
        confidence: { score: null },
      },
    });
    render(<AIChat />);

    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'Review my farm plan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ai-gateway/chat', expect.objectContaining({
      moduleId: 'farmer-advisor',
      capability: 'governed-conversation',
      prompt: 'Review my farm plan',
    })));
    expect(await screen.findByText('Grounded provider response')).toBeInTheDocument();
  });

  test('quick suggestions send their own text rather than stale component state', async () => {
    api.post.mockResolvedValue({ data: { content: 'Response', provider: 'openai' } });
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze current market prices' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ai-gateway/chat', expect.objectContaining({
      prompt: 'Analyze current market prices',
    })));
  });

  test('shows an honest provider error returned by the gateway', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'AI provider unavailable. No generated answer was returned.' } } });
    render(<AIChat />);
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('AI provider unavailable. No generated answer was returned.')).toBeInTheDocument();
  });
});
