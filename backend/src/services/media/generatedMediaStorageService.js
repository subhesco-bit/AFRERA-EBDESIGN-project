'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const MAX_GENERATED_MEDIA_BYTES = 20 * 1024 * 1024;
const LOCAL_ROOT = path.resolve(__dirname, '../../../uploads/generated-product-media');

function safeSegment(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'unknown';
}

function extensionFor(mimeType, requested) {
  if (requested) return safeSegment(requested).replace(/^\./, '').toLowerCase();
  const map = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  return map[mimeType] || 'bin';
}

function publicBase() {
  return String(process.env.MEDIA_PUBLIC_BASE_URL || process.env.CDN_BASE_URL || '').replace(/\/$/, '');
}

function s3Configured() {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET && process.env.AWS_REGION);
}

async function persistGeneratedImage({ productId, buffer, mimeType = 'image/webp', extension, metadata = {} }) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Generated media buffer is required');
  if (!buffer.length) throw new Error('Generated media buffer is empty');
  if (buffer.length > MAX_GENERATED_MEDIA_BYTES) {
    const error = new Error(`Generated media exceeds ${MAX_GENERATED_MEDIA_BYTES} byte limit`);
    error.code = 'GENERATED_MEDIA_TOO_LARGE';
    throw error;
  }

  const ext = extensionFor(mimeType, extension);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const mediaId = crypto.randomUUID();
  const key = `generated-product-media/${safeSegment(productId)}/${mediaId}.${ext}`;
  const base = publicBase();

  if (s3Configured()) {
    const client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
    });
    await client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        checksum,
        productid: safeSegment(productId),
        provider: safeSegment(metadata.provider || 'unknown'),
        model: safeSegment(metadata.model || 'unknown'),
      },
    }));
    return {
      mediaId, storage: 's3', key, checksum, sizeBytes: buffer.length, mimeType,
      publicUrl: base ? `${base}/${key}` : null,
      storageUri: `s3://${process.env.AWS_S3_BUCKET}/${key}`,
      publicAvailable: Boolean(base),
    };
  }

  const target = path.join(LOCAL_ROOT, safeSegment(productId), `${mediaId}.${ext}`);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, buffer, { flag: 'wx' });
  return {
    mediaId, storage: 'local', key, checksum, sizeBytes: buffer.length, mimeType,
    publicUrl: base ? `${base}/${key}` : null,
    storageUri: `local-media://${key}`,
    publicAvailable: Boolean(base),
    localPath: target,
  };
}

function publicStorageView(record) {
  if (!record) return null;
  return {
    mediaId: record.mediaId,
    storage: record.storage,
    key: record.key,
    checksum: record.checksum,
    sizeBytes: record.sizeBytes,
    mimeType: record.mimeType,
    publicUrl: record.publicUrl,
    storageUri: record.storageUri,
    publicAvailable: record.publicAvailable,
  };
}

module.exports = {
  MAX_GENERATED_MEDIA_BYTES,
  persistGeneratedImage,
  publicStorageView,
  s3Configured,
};
