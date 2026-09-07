const express = require('express');
const router = express.Router();

router.get('/modules', (req, res) => {
  res.json({ modules: [] });
});

module.exports = router;
