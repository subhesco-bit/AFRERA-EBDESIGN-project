/**
 * Real backend routes for the Multilingual components (AutoTranslate,
 * MultilingualProvider), backed by services/legacy/multilingualService.js.
 *
 * getPreferences/updatePreferences -> getUserLanguagePreferences/
 * updateUserLanguagePreferences (name diff + need the authenticated user's
 * id). detect -> detectLanguage, getLanguages -> getAvailableLanguages
 * (name diffs). getContent, which the components also call, takes a
 * contentKey as its real first argument (getContentTranslation(contentKey,
 * languageCode, ...)) that the component doesn't provide - too ambiguous
 * to guess-map, not wired.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/multilingualService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/multilingual/preferences', wrap((req) => svc.getUserLanguagePreferences(req.user?.id)));
router.put('/multilingual/preferences', wrap((req) => svc.updateUserLanguagePreferences(req.user?.id, req.body)));
router.post('/multilingual/detect', wrap((req) => svc.detectLanguage(req.body.text)));
router.get('/multilingual/languages', wrap(() => svc.getAvailableLanguages()));
router.post('/multilingual/translate', wrap((req) => svc.translateText(req.body.text, req.body.source_language, req.body.target_language)));

module.exports = router;
