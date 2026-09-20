const express = require('express');
const libraryLoaderService = require('../services/libraryLoaderService');

const router = express.Router();

// Initialize library
libraryLoaderService.initialize().catch(console.error);

// Get library stats
router.get('/stats', (req, res) => {
  res.json(libraryLoaderService.getLibraryStats());
});

// Search library
router.get('/search/:service', (req, res) => {
  const results = libraryLoaderService.searchByService(req.params.service);
  res.json(results);
});

// Get all library
router.get('/all', (req, res) => {
  res.json(libraryLoaderService.getAll());
});

module.exports = router;
