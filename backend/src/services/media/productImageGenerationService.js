'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');
const {
  persistGeneratedImage,
  publicStorageView,
  MAX_GENERATED_MEDIA_BYTES,
} = require('./generatedMediaStorageService');

const IMAGE_PROVIDER_ENV = Object.freeze({
  openai_images: { primary: 'OPENAI_API_KEY', liveAdapterImplemented: true },
  stability: { primary: 'STABILITY_API_KEY', liveAdapterImplemented: false },
});

function normalizeImageOptions(opts = {}, env = process.env) {
  const sizes = new Set(['1024x1024', '1536x1024', '1024x1536', 'auto']);
  const qualities = new Set(['low', 'medium', 'high', 'auto']);
  const formats = new Set(['png', 'jpeg', 'webp']);
  return {
    model: opts.model || env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare',
    size: sizes.has(opts.size) ? opts.size : '1024x1024',
    quality: qualities.has(opts.quality) ? opts.quality : 'medium',
    outputFormat: formats.has(opts.outputFormat) ? opts.outputFormat : 'webp',
  };
}

function buildGovernedImagePrompt(product, requestedPrompt, mediaType = 'product') {
  const style = mediaType === 'cartoon'
    ? 'Create a clean, family-safe product illustration with accurate physical form and natural colors.'
    : 'Create a high-quality marketplace product photograph with accurate physical form, texture, and natural colors.';
  const facts = [
    `Product name: ${product.name}.`,
    product.description ? `Documented product context: ${String(product.description).slice(0, 600)}.` : '',
    product.usp ? `Documented positioning context: ${String(product.usp).slice(0, 300)}.` : '',
  ].filter(Boolean).join(' ');
  const direction = requestedPrompt && String(requestedPrompt).trim()
    ? `Creative direction: ${String(requestedPrompt).trim().slice(0, 1800)}.`
    : '';
  return [
    style,
    facts,
    direction,
    'Do not add text, labels, logos, seals, certification marks, GI badges, medical claims, nutrition claims, prices, watermarks, people, or branded packaging.',
    'Do not invent geographic origin, certification, variety traits, harvest facts, or product claims that are not visually inherent.',
    'Use a neutral uncluttered background suitable for a product catalog.',
  ].filter(Boolean).join(' ');
}

class ProductImageGenerationService {
  constructor(options = {}) {
    this.env = options.env || process.env;
    this.http = options.http || axios;
    this.getDb = options.getDb || getPostgreSQL;
    this.persistImage = options.persistImage || persistGeneratedImage;
    this.log = options.logger || logger;
  }

  providerStatus(providerKey) {
    const config = IMAGE_PROVIDER_ENV[providerKey];
    if (!config) return { provider: providerKey, known: false, configured: false };
    return {
      provider: providerKey,
      known: true,
      envVar: config.primary,
      configured: Boolean(this.env[config.primary]),
      liveAdapterImplemented: Boolean(config.liveAdapterImplemented),
    };
  }

  listProviders() {
    return Object.keys(IMAGE_PROVIDER_ENV).map((key) => this.providerStatus(key));
  }
  async callProvider(providerKey, prompt, opts = {}) {
    const status = this.providerStatus(providerKey);
    if (!status.known) return { ok: false, status: 'unknown_provider', provider: providerKey };
    if (!status.configured) return { ok: false, status: 'not_configured', provider: providerKey, envVar: status.envVar };
    if (!status.liveAdapterImplemented) return { ok: false, status: 'unsupported_provider', provider: providerKey };
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) return { ok: false, status: 'invalid_prompt', provider: providerKey };
    if (prompt.length > 4000) return { ok: false, status: 'prompt_too_large', provider: providerKey };

    const normalized = normalizeImageOptions(opts, this.env);
    const started = Date.now();
    try {
      const response = await this.http.post('https://api.openai.com/v1/images/generations', {
        model: normalized.model,
        prompt: prompt.trim(),
        size: normalized.size,
        quality: normalized.quality,
        n: 1,
        output_format: normalized.outputFormat,
      }, {
        headers: { Authorization: `Bearer ${this.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: Number(this.env.OPENAI_IMAGE_TIMEOUT_MS || 120000),
        maxContentLength: 35 * 1024 * 1024,
        maxBodyLength: 35 * 1024 * 1024,
      });
      const image = response.data?.data?.[0];
      if (!image?.b64_json && !image?.url) {
        return { ok: false, status: 'provider_empty_response', provider: providerKey, model: normalized.model };
      }
      let imageBuffer = null;
      if (image.b64_json) {
        imageBuffer = Buffer.from(image.b64_json, 'base64');
        if (!imageBuffer.length) return { ok: false, status: 'provider_invalid_image', provider: providerKey, model: normalized.model };
        if (imageBuffer.length > MAX_GENERATED_MEDIA_BYTES) {
          return { ok: false, status: 'provider_image_too_large', provider: providerKey, model: normalized.model, sizeBytes: imageBuffer.length };
        }
      }
      return {
        ok: true, status: 'completed', provider: providerKey, model: normalized.model,
        size: normalized.size, quality: normalized.quality, outputFormat: normalized.outputFormat,
        imageBuffer, imageUrl: image.url || null, revisedPrompt: image.revised_prompt || null,
        generationTimeMs: Date.now() - started,
      };
    } catch (error) {
      const providerMessage = error.response?.data?.error?.message || error.message;
      this.log.error('Image provider request failed', { provider: providerKey, status: error.response?.status, error: providerMessage });
      return { ok: false, status: 'provider_error', provider: providerKey, error: providerMessage, httpStatus: error.response?.status || null, generationTimeMs: Date.now() - started };
    }
  }

  async fetchProviderImageBuffer(url) {
    const response = await this.http.get(url, {
      responseType: 'arraybuffer',
      timeout: Number(this.env.OPENAI_IMAGE_DOWNLOAD_TIMEOUT_MS || 60000),
      maxContentLength: MAX_GENERATED_MEDIA_BYTES,
    });
    const buffer = Buffer.from(response.data);
    if (buffer.length > MAX_GENERATED_MEDIA_BYTES) {
      const error = new Error('Downloaded provider image exceeds generated-media limit');
      error.code = 'GENERATED_MEDIA_TOO_LARGE';
      throw error;
    }
    return buffer;
  }

  async persistDatabaseRecord(pg, productId, governedPrompt, result, stored) {
    const mediaUrl = stored.publicUrl || stored.storageUri;
    const client = typeof pg.connect === 'function' ? await pg.connect() : pg;
    let committed = false;
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO ai_generated_images
          (image_id, product_id, prompt_text, image_url, cdn_url, generation_time_ms, is_fallback)
         VALUES ($1,$2,$3,$4,$5,$6,FALSE)
         ON CONFLICT (image_id) DO NOTHING`,
        [stored.mediaId, productId, governedPrompt, mediaUrl, stored.publicUrl, result.generationTimeMs || null],
      );
      await client.query(
        `INSERT INTO media_assets
          (owner_type, owner_id, media_type, url, mime_type, size_bytes, checksum)
         VALUES ('product', $1, 'image', $2, $3, $4, $5)`,
        [productId, mediaUrl, stored.mimeType, stored.sizeBytes, stored.checksum],
      );
      if (stored.publicUrl) {
        await client.query(
          `UPDATE products
             SET image_generation_status='completed', image_generated_at=NOW(),
                 primary_image_id=COALESCE(primary_image_id,$1),
                 images=COALESCE(images,'[]'::jsonb) || $2::jsonb
           WHERE id=$3`,
          [stored.mediaId, JSON.stringify([stored.publicUrl]), productId],
        );
      } else {
        await client.query(
          `UPDATE products
             SET image_generation_status='completed', image_generated_at=NOW(),
                 primary_image_id=COALESCE(primary_image_id,$1)
           WHERE id=$2`,
          [stored.mediaId, productId],
        );
      }
      await client.query('COMMIT');
      committed = true;
    } finally {
      if (!committed) {
        try { await client.query('ROLLBACK'); } catch (_) { /* preserve primary failure */ }
      }
      if (client !== pg && typeof client.release === 'function') client.release();
    }
  }

  async requestProductImageGeneration(productId, prompt, options = {}) {
    const pg = this.getDb();
    if (!pg) throw new Error('PostgreSQL is required for product media generation');
    const { rows } = await pg.query('SELECT id, name, description, usp FROM products WHERE id=$1', [productId]);
    const product = rows[0];
    if (!product) {
      const error = new Error(`Product ${productId} not found`);
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }

    await pg.query(`UPDATE products SET image_generation_status='pending' WHERE id=$1`, [productId]);
    const governedPrompt = buildGovernedImagePrompt(product, prompt, options.mediaType || 'product');
    const promptSha256 = crypto.createHash('sha256').update(governedPrompt).digest('hex');
    const result = await this.callProvider(options.provider || 'openai_images', governedPrompt, options);

    if (!result.ok) {
      const recordedStatus = result.status === 'not_configured' ? 'not_configured' : 'failed';
      await pg.query('UPDATE products SET image_generation_status=$1 WHERE id=$2', [recordedStatus, productId]);
      return { productId, ok: false, status: result.status, provider: result.provider, model: result.model || null, promptSha256, recordedStatus, error: result.error || null };
    }
    try {
      const buffer = result.imageBuffer || (result.imageUrl ? await this.fetchProviderImageBuffer(result.imageUrl) : null);
      if (!buffer) throw new Error('Provider completed without persistable image bytes');
      const mimeType = result.outputFormat === 'png' ? 'image/png' : result.outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const stored = await this.persistImage({
        productId, buffer, mimeType, extension: result.outputFormat,
        metadata: { provider: result.provider, model: result.model, promptSha256 },
      });
      await this.persistDatabaseRecord(pg, productId, governedPrompt, result, stored);
      this.log.info('Product image generation completed', {
        productId, provider: result.provider, model: result.model, mediaId: stored.mediaId,
        publicAvailable: stored.publicAvailable, sizeBytes: stored.sizeBytes,
      });
      return {
        productId, ok: true, status: 'completed', recordedStatus: 'completed',
        provider: result.provider, model: result.model, promptSha256,
        revisedPrompt: result.revisedPrompt, generationTimeMs: result.generationTimeMs,
        mediaType: options.mediaType || 'product', storage: publicStorageView(stored),
        productionDeliveryStatus: stored.publicAvailable ? 'PUBLIC_URL_AVAILABLE_REQUIRES_MEDIA_QA' : 'STORED_NOT_PUBLIC',
        reviewRequired: true,
      };
    } catch (error) {
      await pg.query(`UPDATE products SET image_generation_status='failed' WHERE id=$1`, [productId]);
      this.log.error('Generated image persistence failed', { productId, error: error.message });
      throw error;
    }
  }
  async requestProductCartoonGeneration(productId, prompt) {
    return this.requestProductImageGeneration(productId, prompt, { mediaType: 'cartoon' });
  }
}

const singleton = new ProductImageGenerationService();

module.exports = singleton;
module.exports.ProductImageGenerationService = ProductImageGenerationService;
module.exports.IMAGE_PROVIDER_ENV = IMAGE_PROVIDER_ENV;
module.exports.normalizeImageOptions = normalizeImageOptions;
module.exports.buildGovernedImagePrompt = buildGovernedImagePrompt;
