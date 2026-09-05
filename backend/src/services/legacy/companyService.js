/**
 * Company Service — lookup endpoint for ERP accounting modules.
 *
 * Provides read access to the companies table (migration 996) so that
 * accounting UI pages (AF-AA, AF-CO, AF-PS) can offer a company picker
 * instead of requiring manual ID entry.
 */

const { getPostgreSQL } = require('..\/database\/connection');
const { logger } = require('..\/utils\/logger');

/**
 * List all active companies.
 */
async function listCompanies() {
  const db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT id, code, name, legal_name, base_currency, country, 
            fiscal_year_start_month, is_active, created_at
       FROM companies 
       WHERE is_active = TRUE 
       ORDER BY code ASC`
  );
  return rows;
}

/**
 * Get a single company by ID.
 */
async function getCompanyById(id) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT * FROM companies WHERE id = $1`,
    [Number(id)]
  );
  if (rows.length === 0) throw new Error(`Company ${id} not found`);
  return rows[0];
}

/**
 * Get fiscal years for a company.
 */
async function getFiscalYears(companyId) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT id, code, start_date, end_date, status 
       FROM fiscal_years 
       WHERE company_id = $1 
       ORDER BY start_date DESC`,
    [Number(companyId)]
  );
  return rows;
}

/**
 * Get chart of accounts for a company (postable accounts only).
 */
async function getChartOfAccounts(companyId) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT id, account_code, account_name, account_type, normal_balance, is_postable
       FROM chart_of_accounts 
       WHERE company_id = $1 AND is_active = TRUE AND is_postable = TRUE
       ORDER BY account_code ASC`,
    [Number(companyId)]
  );
  return rows;
}

module.exports = {
  listCompanies,
  getCompanyById,
  getFiscalYears,
  getChartOfAccounts,
};


