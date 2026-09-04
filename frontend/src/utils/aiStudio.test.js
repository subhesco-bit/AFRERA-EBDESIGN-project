import { buildProductImagePrompt, buildCartoonPrompt, getWellnessStatusTone } from './aiStudio';

describe('aiStudio helpers', () => {
  it('builds a product image prompt with the product and region context', () => {
    const prompt = buildProductImagePrompt('Mango', 'Organic', 'Assam');
    expect(prompt).toContain('Mango');
    expect(prompt).toContain('Assam');
    expect(prompt).toContain('Organic');
  });

  it('builds a cartoon prompt for product marketing', () => {
    const prompt = buildCartoonPrompt('Tomato', 'Farmer story');
    expect(prompt).toContain('cartoon');
    expect(prompt).toContain('Tomato');
  });

  it('returns a valid severity tone for wellness response states', () => {
    expect(getWellnessStatusTone('not_configured')).toBe('warning');
    expect(getWellnessStatusTone('generated')).toBe('success');
    expect(getWellnessStatusTone('error')).toBe('danger');
  });
});
