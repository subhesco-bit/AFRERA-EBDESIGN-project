'use strict';
/** Organism boot/consult functions. Adapted from pine-shadow src/lib/organism/fns.ts.
 *
 * Now wired to real PostgreSQL persistence via boot.server.js (Priority 3
 * from the integration report). If the DB pool isn't initialized yet
 * (backend/src/database/connection.js's initialize() hasn't run — e.g. in
 * tests, or a cold require before server startup), every DB call below
 * fails and this module falls back to the same in-memory snapshot shape
 * it used before, so requiring this module never crashes the process.
 * The logic that was already faithfully ported (diagnose-on-boot,
 * library-first / LLM-gated consult, the Grok enrichment call shape) is
 * unchanged. */

const { diagnose, composeLibraryReading, queryLibraryKnowledge } = require('../library');
const { compactEnvelope, shouldCallLlm } = require('../tokens/economy');
const boot = require('./boot.server');

const memory = { autoOp: 'missing', bootedAt: null, lastPulseAt: null, lastError: null, pulses: [], events: [], nextPulseId: 1, nextEventId: 1 };

async function grokEnrich(query, memoryText) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        model: 'grok-4.5',
        max_tokens: 420,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are the AFRERA nerve. The library is memory. Speak as an organism doctor: name the organ, the missing ligament, the signal that should fire, and the farmer rupee at stake. Do not invent living runtime that the catalog marks missing. Keep it under 220 words. No emoji.' },
          { role: 'user', content: `Consult this library memory and answer the pulse.\n\n${memoryText}\n\nPulse: ${query}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function snapshot() {
  const diagnosis = diagnose();
  try {
    const state = await boot.readOrganismState();
    const pulses = await boot.recentPulses();
    const events = await boot.recentEvents();
    return {
      autoOp: state.booted_at ? 'living' : 'missing', bootedAt: state.booted_at, libraryCards: diagnosis.cards,
      bindings: diagnosis.bindings, lastPulseAt: state.last_pulse_at, lastError: state.last_error,
      diagnosis, pulses, events, reflexesAnswered: diagnosis.reflexesAnswered, persisted: true,
    };
  } catch {
    return {
      autoOp: memory.autoOp, bootedAt: memory.bootedAt, libraryCards: diagnosis.cards, bindings: diagnosis.bindings,
      lastPulseAt: memory.lastPulseAt, lastError: memory.lastError, diagnosis, pulses: memory.pulses,
      events: memory.events, reflexesAnswered: diagnosis.reflexesAnswered, persisted: false,
    };
  }
}

async function bootOrganism() {
  try {
    await boot.markBooted();
  } catch (err) {
    memory.bootedAt = memory.bootedAt ?? new Date().toISOString();
    memory.autoOp = 'living';
    memory.lastError = null;
  }
  try {
    return { ok: true, ...(await snapshot()) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'boot failed';
    memory.lastError = message;
    return { ok: false, error: message, ...(await snapshot()) };
  }
}

async function getOrganism() {
  const snap = await snapshot();
  if (snap.autoOp !== 'living') return bootOrganism();
  return { ok: true, ...snap };
}

async function publishSpineEvent(input) {
  const signal = String(input?.signal ?? '').slice(0, 240);
  if (!signal) return { ok: false, error: 'missing signal' };
  try {
    const events = await boot.publishEvent(signal, input?.organId ?? null, input?.ligamentId ?? null, { via: 'organism.fns' });
    return { ok: true, events };
  } catch {
    memory.events.push({ id: memory.nextEventId++, signal, organId: input?.organId ?? null, ligamentId: input?.ligamentId ?? null, createdAt: new Date().toISOString() });
    return { ok: true, events: memory.events };
  }
}

async function consultLibrary(input) {
  const query = String(input?.query ?? '').trim().slice(0, 500);
  if (!query) return { ok: false, error: 'Ask the library something.' };
  await bootOrganism();
  const diagnosis = diagnose();
  const hits = queryLibraryKnowledge(query, { organId: input?.organId ?? null, limit: 8 });
  const memoryText = composeLibraryReading(query, hits, diagnosis);
  let reading = memoryText;
  let source = 'library';
  if (shouldCallLlm(query)) {
    const packed = compactEnvelope(query).text;
    const enriched = await grokEnrich(query, packed);
    if (enriched) {
      reading = enriched;
      source = 'grok';
    }
  }
  await publishSpineEvent({ signal: 'nerve.consult', organId: input?.organId ?? 'ai', ligamentId: null });
  let pulseId;
  try {
    pulseId = await boot.insertPulse('consult', query, reading, hits.map((h) => h.id), input?.organId ?? null, source);
  } catch {
    pulseId = memory.nextPulseId++;
    memory.pulses.push({ id: pulseId, kind: 'consult', query, reading, cardIds: hits.map((h) => h.id), organId: input?.organId ?? null, source, createdAt: new Date().toISOString() });
    memory.lastPulseAt = new Date().toISOString();
  }
  const snap = await snapshot();
  return { ok: true, source, reading, cardIds: hits.map((h) => h.id), pulseId, pulses: snap.pulses, events: snap.events };
}

module.exports = { bootOrganism, getOrganism, publishSpineEvent, consultLibrary };
