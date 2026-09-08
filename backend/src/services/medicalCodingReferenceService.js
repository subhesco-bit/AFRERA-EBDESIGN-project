'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getPostgreSQL } = require('../database/connection');

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { standard, domain, query } = req.query;
    const pool = getPostgreSQL();
    const params = [];
    const conditions = ['is_active = TRUE'];
    if (standard) { params.push(standard); conditions.push(`standard = $${params.length}`); }
    if (domain) { params.push(domain); conditions.push(`domain = $${params.length}`); }
    if (query) { params.push(`%${String(query).slice(0, 100)}%`); conditions.push(`(code ILIKE $${params.length} OR description ILIKE $${params.length})`); }
    const result = await pool.query(
      `SELECT standard, standard_version, domain, code, description, source_reference
         FROM medical_coding_reference
        WHERE ${conditions.join(' AND ')}
        ORDER BY standard, code
        LIMIT 100`,
      params
    );
    res.json({ data: result.rows, assignment_supported: false, note: 'Reference lookup only; diagnosis and code assignment require qualified clinical review.' });
  } catch (error) {
    next(error);
  }
});

module.exports = { router };
