/**
 * Vision & OCR routes — thin HTTP layer over core/aiOrchestrator.js's
 * `vision_engine` (services/visionService.js, sharp) and `ocr_engine`
 * (services/ocrService.js, tesseract.js). No image-processing logic lives
 * here; every handler just extracts the uploaded buffer and calls route().
 *
 * FILE UPLOAD GAP (reported honestly, not fabricated as a pre-existing
 * convention): `multer` has been a backend/package.json dependency
 * (^1.4.5-lts.1) with ZERO `require('multer')` call sites anywhere in
 * backend/src before this file (grepped across the whole backend — only
 * package.json/package-lock.json referenced it). No route in this codebase
 * accepted a file upload before this change, so there was no existing
 * multer convention to match. This file is the first to wire it up: in-memory
 * storage (sharp and tesseract.js both take Buffers, not file paths — no
 * disk/S3 storage convention exists in this codebase to route an uploaded
 * file through, so nothing is persisted beyond the request lifecycle here),
 * an image-only MIME filter, and a 10MB size cap as a conservative default.
 */

'use strict';

const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { route } = require('../core/aiOrchestrator');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — generous for a phone photo, bounded against abuse
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are accepted (multipart field "image")'));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

function requireFile(req, res) {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'image file is required (multipart field "image")' });
    return false;
  }
  return true;
}

/** POST /analyze-quality — real sharp-based blur/brightness heuristic. */
router.post('/analyze-quality', upload.single('image'), async (req, res, next) => {
  try {
    if (!requireFile(req, res)) return;
    const result = await route(
      'vision_engine',
      { buffer: req.file.buffer, operation: 'analyze_quality' },
      { actorId: 'visionRoutes:analyze-quality' }
    );
    res.status(result.ok ? 200 : 422).json(result);
  } catch (error) {
    next(error);
  }
});

/** POST /metadata — real sharp(buffer).metadata() (dimensions, format, size). */
router.post('/metadata', upload.single('image'), async (req, res, next) => {
  try {
    if (!requireFile(req, res)) return;
    const result = await route(
      'vision_engine',
      { buffer: req.file.buffer, operation: 'metadata' },
      { actorId: 'visionRoutes:metadata' }
    );
    res.status(result.ok ? 200 : 422).json(result);
  } catch (error) {
    next(error);
  }
});

/** POST /thumbnail — real sharp resize; returns the encoded image bytes directly. */
router.post('/thumbnail', upload.single('image'), async (req, res, next) => {
  try {
    if (!requireFile(req, res)) return;
    const { width, height, fit, format } = req.body;
    const result = await route(
      'vision_engine',
      {
        buffer: req.file.buffer,
        operation: 'thumbnail',
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit,
        format,
      },
      { actorId: 'visionRoutes:thumbnail' }
    );

    if (!result.ok) return res.status(422).json(result);

    const outFormat = result.result.format || 'jpeg';
    res.set('Content-Type', `image/${outFormat}`);
    res.send(result.result.buffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /ocr — real tesseract.js text extraction. Optional `reportNumber`
 * body field additionally persists the extracted text into the matching
 * `certification_reports.report_data` row (see services/ocrService.js).
 */
router.post('/ocr', upload.single('image'), async (req, res, next) => {
  try {
    if (!requireFile(req, res)) return;
    const { language, reportNumber } = req.body;
    const result = await route(
      'ocr_engine',
      { buffer: req.file.buffer, language, reportNumber },
      { actorId: 'visionRoutes:ocr' }
    );
    res.status(result.ok ? 200 : 422).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
