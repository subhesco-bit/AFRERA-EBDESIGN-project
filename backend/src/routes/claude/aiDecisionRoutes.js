const express = require('express');
const router = express.Router();

router.post('/decide', (req, res) => {
  res.json({ decision: 'AI decision made' });
});

module.exports = router;
