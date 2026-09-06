import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIImageGenerator from './AIImageGenerator';
import { productMediaAIAPI } from '../services/api';

jest.mock('../services/api', () => ({
  productMediaAIAPI: {
    generateImage: jest.fn(),
  },
}));

describe('AIImageGenerator', () => {
  beforeEach(() => {
    productMediaAIAPI.generateImage.mockReset();
  });

  it('shows provider configuration failure without creating a placeholder image', async () => {
    productMediaAIAPI.generateImage.mockResolvedValue({
      data: { data: { ok: false, envVar: 'OPENAI_API_KEY' } },
    });

    render(<AIImageGenerator productName="Rice" />);
    fireEvent.change(screen.getByLabelText('Product ID'), { target: { value: 'product-1' } });
    fireEvent.click(screen.getByRole('button', { name: /generate image/i }));

    await waitFor(() => expect(screen.getByText(/OPENAI_API_KEY/)).toBeInTheDocument());
    expect(productMediaAIAPI.generateImage).toHaveBeenCalledWith(
      'product-1',
      expect.stringContaining('Rice'),
    );
    expect(screen.queryByAltText('Generated product')).not.toBeInTheDocument();
  });
});
