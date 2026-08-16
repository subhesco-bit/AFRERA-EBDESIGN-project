// Express routes for Farmer Profile (M022)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/profiles', controller.createProfile);
router.get('/profiles', controller.listProfiles);
router.get('/profiles/:id', controller.getProfile);
router.get('/profiles/farmer/:farmerId', controller.getProfileByFarmerId);
router.put('/profiles/:id', controller.updateProfile);
router.get('/profiles/:id/full', controller.getFullProfile);
router.post('/profiles/:id/contacts', controller.addContactInfo);
router.post('/profiles/:id/household', controller.addHouseholdMember);
router.post('/profiles/:id/skills', controller.addSkill);
router.post('/profiles/:id/enrich', controller.enrichProfile);
router.get('/profiles/:id/completeness', controller.analyzeProfileCompleteness);

module.exports = router;
