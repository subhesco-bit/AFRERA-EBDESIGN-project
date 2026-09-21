import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import api from '../../services/componentApi';

vi.mock('../../services/componentApi', () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('AIChat governed provider integration', () => {
  beforeEach(() => vi.clearAllMocks());

  test('sends the selected domain and renders real provider output', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          response: 'Grounded provider response',
          agent: 'farmer-advisor',
          metadata: { provider: 'openai', model: 'configured-model' },
          context: {},
        },
      },
    });
    render(<AIChat />);

    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'Review my farm plan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ai/unified', expect.objectContaining({
      requestType: 'conversational',
      agentPreference: 'farmer-advisor',
      query: 'Review my farm plan',
    })));
    expect(await screen.findByText('Grounded provider response')).toBeInTheDocument();
  });

  test('quick suggestions send their own text rather than stale component state', async () => {
    api.post.mockResolvedValue({ data: { data: { response: 'Response', context: {} } } });
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze current market prices' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ai/unified', expect.objectContaining({
      query: 'Analyze current market prices',
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
