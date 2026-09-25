const { ProductImageGenerationService, normalizeImageOptions, buildGovernedImagePrompt } = require('../services/media/productImageGenerationService');
const { MAX_GENERATED_MEDIA_BYTES, publicStorageView } = require('../services/media/generatedMediaStorageService');

function fakeLogger() { return { info: jest.fn(), warn: jest.fn(), error: jest.fn() }; }

describe('Modern governed product image generation', () => {
  it('uses a current GPT Image default and bounded output options', () => {
    expect(normalizeImageOptions({}, {})).toEqual({
      model: 'gpt-image-2.5-flare', size: '1024x1024', quality: 'medium', outputFormat: 'webp',
    });
    expect(normalizeImageOptions({ size: 'bad', quality: 'ultra', outputFormat: 'gif' }, {})).toEqual({
      model: 'gpt-image-2.5-flare', size: '1024x1024', quality: 'medium', outputFormat: 'webp',
    });
  });

  it('does not call the provider when no credential is configured', async () => {
    const http = { post: jest.fn() };
    const service = new ProductImageGenerationService({ env: {}, http, logger: fakeLogger() });
    const result = await service.callProvider('openai_images', 'product image');
    expect(result).toEqual(expect.objectContaining({ ok: false, status: 'not_configured' }));
    expect(http.post).not.toHaveBeenCalled();
  });

  it('uses current GPT Image request fields and decodes b64_json without exposing the key', async () => {
    const bytes = Buffer.from('fake-image-bytes');
    const http = { post: jest.fn().mockResolvedValue({ data: { data: [{ b64_json: bytes.toString('base64') }] } }) };
    const service = new ProductImageGenerationService({ env: { OPENAI_API_KEY: 'secret-key' }, http, logger: fakeLogger() });
    const result = await service.callProvider('openai_images', 'accurate product photo');
    expect(result.ok).toBe(true);
    expect(result.model).toBe('gpt-image-2.5-flare');
    expect(result.outputFormat).toBe('webp');
    expect(result.imageBuffer.equals(bytes)).toBe(true);
    const [url, body, config] = http.post.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/images/generations');
    expect(body).toEqual(expect.objectContaining({ model: 'gpt-image-2.5-flare', output_format: 'webp', quality: 'medium', size: '1024x1024' }));
    expect(body.response_format).toBeUndefined();
    expect(config.headers.Authorization).toBe('Bearer secret-key');
    expect(JSON.stringify(result)).not.toContain('secret-key');
  });

  it('builds prompts that explicitly prohibit fabricated labels and claims', () => {
    const prompt = buildGovernedImagePrompt({ name: 'Queen Pineapple', description: 'Tripura fruit', usp: 'Sweet fruit' }, 'premium table setup');
    expect(prompt).toContain('Queen Pineapple');
    expect(prompt).toContain('premium table setup');
    expect(prompt).toContain('Do not add text, labels, logos');
    expect(prompt).toContain('Do not invent geographic origin');
  });

  it('keeps internal local paths out of public storage metadata', () => {
    const view = publicStorageView({
      mediaId: 'm1', storage: 'local', key: 'generated/x.webp', checksum: 'abc', sizeBytes: 10,
      mimeType: 'image/webp', publicUrl: null, storageUri: 'local-media://generated/x.webp', publicAvailable: false,
      localPath: 'C:/secret/runtime/path.webp',
    });
    expect(view.localPath).toBeUndefined();
    expect(JSON.stringify(view)).not.toContain('secret/runtime');
  });

  it('defines a generated-media ceiling below the repository 25 MB policy', () => {
    expect(MAX_GENERATED_MEDIA_BYTES).toBe(20 * 1024 * 1024);
    expect(MAX_GENERATED_MEDIA_BYTES).toBeLessThan(25 * 1024 * 1024);
  });

  it('persists successful non-public output without adding it to buyer-facing product images', async () => {
    const pgQueries = [];
    const clientQueries = [];
    const client = {
      query: jest.fn(async (sql, params) => { clientQueries.push({ sql: String(sql), params }); return { rows: [] }; }),
      release: jest.fn(),
    };
    const pg = {
      query: jest.fn(async (sql, params) => {
        pgQueries.push({ sql: String(sql), params });
        if (String(sql).startsWith('SELECT')) return { rows: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Queen Pineapple', description: 'Tripura fruit', usp: 'Sweet' }] };
        return { rows: [] };
      }),
      connect: jest.fn(async () => client),
    };
    const stored = { mediaId: 'media-1', storage: 'local', key: 'generated/product/media-1.webp', checksum: 'hash', sizeBytes: 123, mimeType: 'image/webp', publicUrl: null, storageUri: 'local-media://generated/product/media-1.webp', publicAvailable: false, localPath: 'C:/runtime/image.webp' };
    const service = new ProductImageGenerationService({ getDb: () => pg, persistImage: jest.fn(async () => stored), env: { OPENAI_API_KEY: 'configured' }, logger: fakeLogger() });
    service.callProvider = jest.fn(async () => ({ ok: true, status: 'completed', provider: 'openai_images', model: 'gpt-image-2.5-flare', outputFormat: 'webp', imageBuffer: Buffer.from('image'), generationTimeMs: 10 }));
    const result = await service.requestProductImageGeneration('11111111-1111-1111-1111-111111111111', 'clean studio');
    expect(result.productionDeliveryStatus).toBe('STORED_NOT_PUBLIC');
    expect(result.reviewRequired).toBe(true);
    expect(result.storage.localPath).toBeUndefined();
    expect(clientQueries.some((q) => q.sql.includes('INSERT INTO ai_generated_images'))).toBe(true);
    expect(clientQueries.some((q) => q.sql.includes('INSERT INTO media_assets'))).toBe(true);
    const productUpdate = clientQueries.find((q) => q.sql.includes("image_generation_status='completed'"));
    expect(productUpdate.sql).not.toContain('images=');
    expect(clientQueries.at(-1).sql).toBe('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('fails with PRODUCT_NOT_FOUND before invoking a provider', async () => {
    const pg = { query: jest.fn(async () => ({ rows: [] })) };
    const service = new ProductImageGenerationService({ getDb: () => pg, env: { OPENAI_API_KEY: 'configured' }, logger: fakeLogger() });
    service.callProvider = jest.fn();
    await expect(service.requestProductImageGeneration('00000000-0000-0000-0000-000000000000', 'x')).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    expect(service.callProvider).not.toHaveBeenCalled();
  });
});
