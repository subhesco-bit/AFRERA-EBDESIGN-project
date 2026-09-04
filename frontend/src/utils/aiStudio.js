export function buildProductImagePrompt(productName, description, stateName) {
  const safeProduct = productName || 'farm produce';
  const safeDescription = description || 'fresh produce from a Northeast Indian farm';
  const safeState = stateName || 'Northeast India';

  return [
    'Create a premium ecommerce product hero image for an agricultural marketplace.',
    `Product: ${safeProduct}.`,
    'Visual style: realistic, high-detail agricultural branding, crisp lighting, premium product photography.',
    `Context: ${safeDescription}.`,
    `Region: ${safeState}.`,
    'Avoid watermarking, text overlays, or distortions. Emphasize freshness, trust, and farm-to-market value.',
  ].join(' ');
}

export function buildCartoonPrompt(productName, theme = 'farmer storytelling') {
  const safeName = productName || 'farm produce';
  return [
    `Create a colorful cartoon illustration for ${safeName}.`,
    `Theme: ${theme}.`,
    'Use cheerful, child-friendly farm branding, natural colors, clean composition, and playful narrative storytelling.',
    'Keep the illustration suitable for a digital product listing and promotional card.',
  ].join(' ');
}

export function getWellnessStatusTone(status) {
  switch (status) {
    case 'generated':
      return 'success';
    case 'not_configured':
      return 'warning';
    case 'error':
    case 'failed':
      return 'danger';
    default:
      return 'neutral';
  }
}
