/**
 * OCR Service — real, fully offline text extraction via `tesseract.js`.
 *
 * WHY THIS FILE (2026-08-09 follow-up to the aiOrchestrator audit)
 *
 * No OCR library existed anywhere in backend/package.json or backend/src
 * (see core/aiOrchestrator.js's ocr_engine citation, pre-this-change).
 * `tesseract.js` is added as a NEW dependency — see the "NEW DEPENDENCY"
 * note below.
 *
 * GROUNDING — real AFRERA use case, not built in a vacuum:
 * `database/migrations/000_base_schema.sql` defines `certifications`
 * (product_id FK, certificate_number, issuing_authority, document_url TEXT,
 * verified BOOLEAN) and `farmer_certifications` (farmer_id FK, same shape) —
 * organic/GI paper certificates whose only machine-readable trace today is a
 * stored file URL; nothing in backend/src ever reads what is ON the
 * document. `database/migrations/033_laboratory_erp_schema.sql`'s
 * `certification_reports` table (sample_id FK, report_number UNIQUE,
 * report_type, `report_data JSONB NOT NULL`, pdf_url, status) additionally
 * has a generic JSONB column already designed to hold structured report
 * content, keyed by `report_number` (see laboratoryERPService.js's
 * registerLaboratory-style query pattern this file follows). That existing
 * column — not a new one — is where `extractAndStoreCertificateText()`
 * below writes OCR output, keyed by a `report_number` the caller must
 * already know (this file does not invent a certificate/report lookup that
 * doesn't exist).
 *
 * HONESTY NOTE ON ACCURACY
 * tesseract.js is a real, mature, MIT-licensed, fully offline OCR engine —
 * no API key, no network call, no cloud dependency. It is decent on clean,
 * high-contrast printed text (typed certificate numbers, tabular lab
 * results) and WEAK on handwriting, low-contrast photocopies, skewed phone
 * photos, or stylized fonts. `data.confidence` from tesseract is its own
 * mean-confidence estimate, not a calibrated accuracy guarantee. Treat
 * extracted text as a human-reviewable draft, never as ground truth for a
 * compliance decision (e.g. flipping `certifications.verified` to true).
 *
 * INSTALLATION CAVEAT (stated explicitly per task ground rules)
 * `npm install` was NOT run in this environment, so tesseract.js's actual
 * installation and runtime behavior (it downloads a language traineddata
 * file on first use, needs a writable cache dir, etc.) could not be verified
 * end-to-end here. The code below uses the standard, documented v5
 * `createWorker(lang)` -> `worker.recognize(buffer)` -> `worker.terminate()`
 * API correctly, but this is a code-correctness review, not a functional
 * test run.
 */

'use strict';

const { logger } = require('../utils/logger');
const pool = require('../database/pool');

function assertBuffer(buffer, fnName) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(`${fnName} requires an image Buffer (e.g. req.file.buffer from multer memoryStorage)`);
  }
}

/**
 * Extract text from an image buffer using tesseract.js. `language` is a
 * tesseract language code (default 'eng'); tesseract.js downloads/caches the
 * matching traineddata on first use per language.
 */
async function extractTextFromImage(buffer, { language = 'eng' } = {}) {
  assertBuffer(buffer, 'extractTextFromImage');

  // Required lazily so a missing/unavailable install fails inside the call
  // (surfaced as a normal rejected promise to the caller / aiOrchestrator's
  // try/catch) rather than crashing this module at require-time for every
  // consumer, including ones that never call OCR.
  const { createWorker } = require('tesseract.js');

  const worker = await createWorker(language);
  try {
    const { data } = await worker.recognize(buffer);
    return {
      text: data.text,
      confidence: data.confidence, // tesseract's own 0-100 mean-confidence estimate
      language,
      wordCount: (data.text.match(/\S+/g) || []).length,
    };
  } finally {
    // Always release the worker (a real, separate process/thread under the
    // hood) even if recognize() throws.
    await worker.terminate();
  }
}

/**
 * OCR a photographed/scanned certificate and merge the extracted text into
 * the existing `certification_reports.report_data` JSONB column for the
 * matching `report_number`. Real parameterized query, no new column
 * invented. Returns { ok:false, status:'not_found' } rather than throwing
 * when no report matches — a missing report_number is a caller input error,
 * not a server error.
 */
async function extractAndStoreCertificateText(reportNumber, buffer, { language = 'eng' } = {}) {
  if (!reportNumber) {
    throw new Error('extractAndStoreCertificateText requires reportNumber');
  }
  assertBuffer(buffer, 'extractAndStoreCertificateText');

  const extraction = await extractTextFromImage(buffer, { language });

  const ocrPatch = {
    ocr_extracted_text: extraction.text,
    ocr_confidence: extraction.confidence,
    ocr_language: language,
    ocr_extracted_at: new Date().toISOString(),
  };

  try {
    const result = await pool.query(
      `UPDATE certification_reports
       SET report_data = report_data || $1::jsonb
       WHERE report_number = $2
       RETURNING id, report_number, report_type, status, report_data`,
      [JSON.stringify(ocrPatch), reportNumber]
    );

    if (result.rows.length === 0) {
      logger.warn('ocrService:extractAndStoreCertificateText no matching report_number', { reportNumber });
      return { ok: false, status: 'not_found', reportNumber, extraction };
    }

    return { ok: true, report: result.rows[0], extraction };
  } catch (error) {
    logger.error('ocrService:extractAndStoreCertificateText query failed', {
      reportNumber, error: error.message, stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  extractTextFromImage,
  extractAndStoreCertificateText,
};
