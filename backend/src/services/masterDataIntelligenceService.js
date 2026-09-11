const crypto = require('crypto');
const { getPostgreSQL } = require('../database');

function id() { return crypto.randomUUID(); }

class MasterDataIntelligenceService {
  constructor() { this.db = getPostgreSQL(); }

  normalize(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  similarity(a, b) {
    const x = this.normalize(a), y = this.normalize(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    const max = Math.max(x.length, y.length);
    let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
    for (let i = 1; i <= x.length; i++) {
      const cur = [i];
      for (let j = 1; j <= y.length; j++) {
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return 1 - prev[y.length] / max;
  }

  findDuplicates(records, key = 'name') {
    const findings = [];
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const confidence = this.similarity(records[i]?.[key], records[j]?.[key]);
        if (confidence >= 0.9) findings.push({ left: records[i], right: records[j], confidence });
      }
    }
    return findings;
  }

  async recordFinding({ entityType, entityId, ruleCode, severity, finding, sourceSystem, confidence }) {
    const result = await this.db.query(
      `INSERT INTO master_data_quality_findings
       (id,entity_type,entity_id,rule_code,severity,finding,source_system,confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id(), entityType, String(entityId), ruleCode, severity, JSON.stringify(finding || {}), sourceSystem || null, confidence ?? null]
    );
    return result.rows[0];
  }

  async reconcile({ entityType, sources = [] }) {
    const correlationId = id();
    const records = sources.flatMap(source => (source.records || []).map(record => ({ ...record, source_system: source.name })));
    const duplicates = this.findDuplicates(records);
    const results = { duplicates, records: records.length };
    const result = await this.db.query(
      `INSERT INTO master_data_reconciliation_runs
       (id,correlation_id,entity_type,source_count,candidate_count,matched_count,conflict_count,duplicate_count,results,status,completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed',NOW()) RETURNING *`,
      [id(), correlationId, entityType, sources.length, records.length, records.length - duplicates.length,
       duplicates.length, duplicates.length, JSON.stringify(results)]
    );
    return result.rows[0];
  }
}

module.exports = new MasterDataIntelligenceService();
