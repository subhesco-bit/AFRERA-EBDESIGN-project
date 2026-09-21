#!/usr/bin/env node
/**
 * EBDESIGN Library Activity Tracker
 *
 * Maintains a persistent file activity ledger for the enterprise project
 * library. It compares the current enterprise file index against the previous
 * snapshot and records created, deleted, modified, and move-candidate events.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const projectRoot = process.cwd();
const indexDir = path.join(projectRoot, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const filesCsvPath = path.join(indexDir, 'enterprise-project-library-files.csv');
const snapshotPath = path.join(indexDir, 'enterprise-file-activity-snapshot.jsonl');
const ledgerPath = path.join(indexDir, 'enterprise-file-activity-ledger.jsonl');
const summaryPath = path.join(indexDir, 'enterprise-file-activity-summary.json');
const latestPath = path.join(indexDir, 'enterprise-file-activity-latest.json');
const progressPath = path.join(indexDir, 'enterprise-file-activity-progress.json');
const BATCH_SIZE = Number(process.env.LIBRARY_ACTIVITY_BATCH_SIZE || 25000);

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function keyFor(record) {
  return `${record.source_label}\0${record.relative_path}`;
}

function movementKey(record) {
  if (record.sha256) return `hash:${record.sha256}`;
  return `meta:${record.basename}\0${record.file_type}\0${record.bytes}`;
}

function toTrackedRecord(row) {
  return {
    library_id: row.library_id || '',
    source_label: row.source_label || '',
    source_role: row.source_role || '',
    absolute_path: row.absolute_path || '',
    relative_path: row.relative_path || '',
    basename: row.basename || '',
    file_type: row.file_type || '',
    extension: row.extension || '',
    bytes: Number(row.bytes || 0),
    modified: row.modified || '',
    category: row.category || '',
    feature_key: row.feature_key || '',
    workflow_role: row.workflow_role || '',
    hash_status: row.hash_status || '',
    sha256: row.sha256 || '',
    review_required: row.review_required === 'true',
    content_summary: row.content_summary || '',
  };
}

async function readCurrentIndex() {
  if (!fs.existsSync(filesCsvPath)) {
    throw new Error(`Enterprise file index does not exist: ${filesCsvPath}`);
  }

  const records = new Map();
  const rl = readline.createInterface({
    input: fs.createReadStream(filesCsvPath),
    crlfDelay: Infinity,
  });

  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    const record = toTrackedRecord(row);
    records.set(keyFor(record), record);
  }

  return records;
}

async function streamCurrentIndex(onRecord) {
  if (!fs.existsSync(filesCsvPath)) {
    throw new Error(`Enterprise file index does not exist: ${filesCsvPath}`);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(filesCsvPath),
    crlfDelay: Infinity,
  });

  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    await onRecord(toTrackedRecord(row));
  }
}

async function readSnapshot() {
  const records = new Map();
  if (!fs.existsSync(snapshotPath)) return records;

  const rl = readline.createInterface({
    input: fs.createReadStream(snapshotPath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    records.set(keyFor(record), record);
  }

  return records;
}

function didRecordChange(previous, current) {
  return previous.bytes !== current.bytes ||
    previous.modified !== current.modified ||
    previous.file_type !== current.file_type ||
    previous.category !== current.category ||
    previous.feature_key !== current.feature_key ||
    previous.workflow_role !== current.workflow_role ||
    previous.hash_status !== current.hash_status ||
    previous.sha256 !== current.sha256 ||
    previous.content_summary !== current.content_summary;
}

function event(type, record, extra = {}) {
  return {
    event_id: `EBDACT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    event_type: type,
    observed_at: new Date().toISOString(),
    library_id: record.library_id,
    name: record.basename,
    file_type: record.file_type,
    bytes: record.bytes,
    source_label: record.source_label,
    source_role: record.source_role,
    relative_path: record.relative_path,
    absolute_path: record.absolute_path,
    feature_key: record.feature_key,
    workflow_role: record.workflow_role,
    sha256: record.sha256,
    hash_status: record.hash_status,
    content_summary: record.content_summary,
    ...extra,
  };
}

function writeSnapshot(records) {
  const tempPath = `${snapshotPath}.tmp`;
  const stream = fs.createWriteStream(tempPath, { encoding: 'utf8' });
  for (const record of records.values()) {
    stream.write(`${JSON.stringify(record)}\n`);
  }
  stream.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      fs.renameSync(tempPath, snapshotPath);
      resolve();
    });
    stream.on('error', reject);
  });
}

function appendLedger(events) {
  if (!events.length) return;
  fs.appendFileSync(ledgerPath, events.map((item) => JSON.stringify(item)).join('\n') + '\n');
}

async function main() {
  fs.mkdirSync(indexDir, { recursive: true });

  const previous = await readSnapshot();
  const baselineCreated = previous.size === 0;
  const events = [];
  const created = [];
  const deleted = [];
  let currentCount = 0;
  let batchNumber = 0;
  const tempSnapshotPath = `${snapshotPath}.tmp`;
  const snapshotStream = fs.createWriteStream(tempSnapshotPath, { encoding: 'utf8' });

  function writeProgress(status = 'running') {
    const payload = {
      generatedAt: new Date().toISOString(),
      status,
      batchNumber,
      batchSize: BATCH_SIZE,
      filesProcessed: currentCount,
      eventsBuffered: events.length,
      baselineCreated,
      snapshotPath,
      ledgerPath,
    };
    fs.writeFileSync(progressPath, `${JSON.stringify(payload, null, 2)}\n`);
    if (status === 'running') {
      console.log(JSON.stringify({ batch: batchNumber, filesProcessed: currentCount, eventsBuffered: events.length }));
    }
  }

  if (baselineCreated) {
    await streamCurrentIndex((record) => {
      currentCount += 1;
      snapshotStream.write(`${JSON.stringify(record)}\n`);
      if (currentCount % BATCH_SIZE === 0) {
        batchNumber += 1;
        writeProgress();
      }
    });

    await new Promise((resolve, reject) => {
      snapshotStream.end();
      snapshotStream.on('finish', resolve);
      snapshotStream.on('error', reject);
    });
    fs.renameSync(tempSnapshotPath, snapshotPath);

    const baselineEvent = {
      event_id: `EBDACT-${Date.now().toString(36).toUpperCase()}-BASELINE`,
      event_type: 'baseline_snapshot_created',
      observed_at: new Date().toISOString(),
      files_recorded: currentCount,
      snapshot_path: snapshotPath,
      index_path: filesCsvPath,
    };
    appendLedger([baselineEvent]);

    const summary = {
      generatedAt: new Date().toISOString(),
      libraryMode: 'active-file-ledger',
      baselineCreated: true,
      filesInPreviousSnapshot: 0,
      filesInCurrentSnapshot: currentCount,
      eventsRecordedThisRun: 1,
      eventCounts: { baseline_snapshot_created: 1 },
      snapshotPath,
      ledgerPath,
      indexPath: filesCsvPath,
    };

    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    fs.writeFileSync(latestPath, `${JSON.stringify({
      generatedAt: summary.generatedAt,
      returned: 1,
      events: [baselineEvent],
    }, null, 2)}\n`);
    writeProgress('complete');

    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await streamCurrentIndex((record) => {
    currentCount += 1;
    snapshotStream.write(`${JSON.stringify(record)}\n`);
    const key = keyFor(record);
    const old = previous.get(key);
    if (!old) {
      const createdEvent = event('created_or_entered_system', record);
      created.push(createdEvent);
      events.push(createdEvent);
      return;
    }

    if (didRecordChange(old, record)) {
      events.push(event('changed_in_system', record, {
        previous_bytes: old.bytes,
        previous_modified: old.modified,
        previous_file_type: old.file_type,
        previous_feature_key: old.feature_key,
        previous_workflow_role: old.workflow_role,
        previous_sha256: old.sha256,
      }));
    }
    previous.delete(key);
    if (currentCount % BATCH_SIZE === 0) {
      batchNumber += 1;
      writeProgress();
    }
  });

  await new Promise((resolve, reject) => {
    snapshotStream.end();
    snapshotStream.on('finish', resolve);
    snapshotStream.on('error', reject);
  });
  fs.renameSync(tempSnapshotPath, snapshotPath);

  for (const record of previous.values()) {
    const deletedEvent = event('deleted_or_left_system', record);
    deleted.push(deletedEvent);
    events.push(deletedEvent);
  }

  const createdByMoveKey = new Map();
  for (const item of created) {
    const key = movementKey(item);
    if (!createdByMoveKey.has(key)) createdByMoveKey.set(key, []);
    createdByMoveKey.get(key).push(item);
  }

  for (const item of deleted) {
    const candidates = createdByMoveKey.get(movementKey(item)) || [];
    for (const candidate of candidates.slice(0, 3)) {
      events.push(event('moved_or_renamed_candidate', candidate, {
        previous_library_id: item.library_id,
        previous_source_label: item.source_label,
        previous_relative_path: item.relative_path,
        previous_absolute_path: item.absolute_path,
        movement_confidence: item.sha256 && candidate.sha256 ? 'high_hash_match' : 'medium_metadata_match',
      }));
    }
  }

  appendLedger(events);

  const counts = {};
  for (const item of events) counts[item.event_type] = (counts[item.event_type] || 0) + 1;

  const summary = {
    generatedAt: new Date().toISOString(),
    libraryMode: 'active-file-ledger',
    baselineCreated: false,
    filesInPreviousSnapshot: previous.size + currentCount - created.length,
    filesInCurrentSnapshot: currentCount,
    eventsRecordedThisRun: events.length,
    eventCounts: counts,
    snapshotPath,
    ledgerPath,
    indexPath: filesCsvPath,
  };

  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(latestPath, `${JSON.stringify({
    generatedAt: summary.generatedAt,
    returned: Math.min(events.length, 1000),
    events: events.slice(0, 1000),
  }, null, 2)}\n`);
  writeProgress('complete');

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
