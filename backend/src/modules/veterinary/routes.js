/**
 * Veterinary Specialist Panel HTTP routes
 * Mount under /api/veterinary or /api/m127
 */

const express = require('express');
const panel = require('./panel/VeterinarySpecialistPanel');
const knowledge = require('./knowledge');
const { VETERINARY_CLINICAL_DISCLAIMER } = require('../../utils/disclaimers');

function createVeterinaryRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      module: 'veterinary-specialist-panel',
      species: panel.SUPPORTED_SPECIES,
      knowledge_version: knowledge.KNOWLEDGE_VERSION,
      tier: 'grok-highest',
    });
  });

  router.get('/species', (_req, res) => {
    res.json({
      supported: panel.SUPPORTED_SPECIES,
      norms: panel.NORMS,
      vaccination_calendars: panel.VAX_CALENDARS,
      disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    });
  });

  router.get('/diseases/:species', (req, res) => {
    try {
      const diseases = knowledge.listDiseases(req.params.species);
      res.json({
        species: panel.normaliseSpecies(req.params.species),
        count: diseases.length,
        diseases,
        disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
      });
    } catch (e) {
      res.status(400).json({ error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
    }
  });

  router.get('/ethnovet/:species', (req, res) => {
    try {
      const remedies = knowledge.getEthnovetForSpecies(req.params.species);
      res.json({
        species: panel.normaliseSpecies(req.params.species),
        remedies,
        disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  /** Full multi-specialist case conference */
  router.post('/panel/conference', (req, res) => {
    try {
      const report = panel.runConference(req.body || {});
      res.json(report);
    } catch (e) {
      res.status(400).json({ error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
    }
  });

  /** Herd / multi-animal screen */
  router.post('/panel/herd-screen', (req, res) => {
    try {
      const report = panel.runHerdScreen(req.body || {});
      res.json(report);
    } catch (e) {
      res.status(400).json({ error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
    }
  });

  /** Vitals-only interpretation */
  router.post('/panel/vitals', (req, res) => {
    try {
      const species = panel.normaliseSpecies(req.body?.species);
      const vitals = panel.interpretVitals(species, req.body?.clinical || {});
      res.json({ species, vitals, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/panel/vaccination-gaps', (req, res) => {
    try {
      const species = panel.normaliseSpecies(req.body?.species);
      const analysis = panel.vaccinationGapAnalysis(species, req.body || {});
      res.json({ species, ...analysis, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}

module.exports = { createVeterinaryRouter };
