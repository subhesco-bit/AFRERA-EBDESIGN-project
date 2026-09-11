const crypto = require('crypto');
const { getPostgreSQL } = require('../database');

const uuid = () => crypto.randomUUID();

class CloneGapClosureService {
  constructor() { this.db = getPostgreSQL(); }

  async createJournal({ journalDate, sourceType, sourceId, description, lines }) {
    if (!Array.isArray(lines) || !lines.length) throw new Error('At least one journal line is required');
    const debit = lines.filter(x => x.direction === 'debit').reduce((s,x)=>s+Number(x.amount||0),0);
    const credit = lines.filter(x => x.direction === 'credit').reduce((s,x)=>s+Number(x.amount||0),0);
    if (Math.abs(debit-credit) > 0.005) throw new Error('Journal is not balanced');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const journalId=uuid();
      await client.query(`INSERT INTO finance_journals(id,journal_date,source_type,source_id,description) VALUES($1,$2,$3,$4,$5)`,[journalId,journalDate,sourceType,sourceId,description||null]);
      for(const line of lines) await client.query(`INSERT INTO finance_journal_lines(id,journal_id,account_code,direction,amount,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[uuid(),journalId,line.accountCode,line.direction,Number(line.amount),line.entityType||null,line.entityId||null,JSON.stringify(line.metadata||{})]);
      await client.query('COMMIT');
      return journalId;
    } catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async enqueueEvent({ eventType, aggregateType, aggregateId, correlationId, payload }) {
    const q=await this.db.query(`INSERT INTO integration_outbox_events(id,event_type,aggregate_type,aggregate_id,correlation_id,payload) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[uuid(),eventType,aggregateType,String(aggregateId),correlationId||uuid(),JSON.stringify(payload||{})]);
    return q.rows[0];
  }

  async recordVerification({ runId, domain, checkCode, status, evidence }) {
    const q=await this.db.query(`INSERT INTO production_verification_evidence(id,verification_run_id,domain,check_code,status,evidence) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[uuid(),runId,domain,checkCode,status,JSON.stringify(evidence||{})]);
    return q.rows[0];
  }

  async reconcileEntity({ entityType, canonicalKey, attributes, provenance, sourceCount, confidence }) {
    const q=await this.db.query(`INSERT INTO master_entity_canonical_records(id,entity_type,canonical_key,source_count,confidence,attributes,provenance) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(entity_type,canonical_key) DO UPDATE SET source_count=EXCLUDED.source_count,confidence=EXCLUDED.confidence,attributes=EXCLUDED.attributes,provenance=EXCLUDED.provenance,updated_at=NOW() RETURNING *`,[uuid(),entityType,canonicalKey,sourceCount||0,confidence??null,JSON.stringify(attributes||{}),JSON.stringify(provenance||[])]);
    return q.rows[0];
  }
}
module.exports = new CloneGapClosureService();
