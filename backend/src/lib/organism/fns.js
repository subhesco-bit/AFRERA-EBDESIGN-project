'use strict';
/** Organism boot/consult functions. Adapted from pine-shadow src/lib/organism/fns.ts.
 *
 * The original is written as TanStack `createServerFn` handlers backed by
 * PGLite (`getSql()` from `@/lib/db`) and a `boot.server.ts` that creates
 * ai_pulses / organism_state / spine_events tables. This project is
 * Express + PostgreSQL, not TanStack + PGLite, so the persistence layer
 * below is an in-memory reference implementation of the same shape
 * (autoOp/bootedAt/libraryCards/bindings/pulses/events), NOT yet wired to
 * backend/src/database/connection.js. Wiring real Postgres persistence is
 * the concrete next step — see .ai/COMPLETE_INTEGRATION_REPORT.html.
 * The real logic that IS faithfully ported: the diagnose-on-boot pattern,
 * the library-first / LLM-gated consult flow, and the xAI Grok enrichment
 * call shape (same env var, same system prompt, same 5s timeout). */

const { diagnose, composeLibraryReading, queryLibraryKnowledge } = require('../library');
const { compactEnvelope, shouldCallLlm } = require('../tokens/economy');

const state = {
  autoOp: 'missing',
  bootedAt: null,
  lastPulseAt: null,
  lastError: null,
  pulses: [],
  events: [],
  nextPulseId: 1,
  nextEventId: 1,
};

async function grokEnrich(query, memory) {
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
          { role: 'user', content: `Consult this library memory and answer the pulse.\n\n${memory}\n\nPulse: ${query}` },
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

function snapshot() {
  const diagnosis = diagnose();
  return {
    autoOp: state.autoOp,
    bootedAt: state.bootedAt,
    libraryCards: diagnosis.cards,
    bindings: diagnosis.bindings,
    lastPulseAt: state.lastPulseAt,
    lastError: state.lastError,
    diagnosis,
    pulses: state.pulses,
    events: state.events,
    reflexesAnswered: diagnosis.reflexesAnswered,
  };
}

async function bootOrganism() {
  try {
    state.bootedAt = state.bootedAt ?? new Date().toISOString();
    state.autoOp = 'living';
    state.lastError = null;
    return { ok: true, ...snapshot() };
  } catch (err) {
    state.lastError = err instanceof Error ? err.message : 'boot failed';
    return { ok: false, error: state.lastError, ...snapshot() };
  }
}

async function getOrganism() {
  if (state.autoOp !== 'living') return bootOrganism();
  return { ok: true, ...snapshot() };
}

async function publishSpineEvent(input) {
  const signal = String(input?.signal ?? '').slice(0, 240);
  if (!signal) return { ok: false, error: 'missing signal' };
  state.events.push({ id: state.nextEventId++, signal, organId: input?.organId ?? null, ligamentId: input?.ligamentId ?? null, createdAt: new Date().toISOString() });
  return { ok: true, events: state.events };
}

async function consultLibrary(input) {
  const query = String(input?.query ?? '').trim().slice(0, 500);
  if (!query) return { ok: false, error: 'Ask the library something.' };
  await bootOrganism();
  const diagnosis = diagnose();
  const hits = queryLibraryKnowledge(query, { organId: input?.organId ?? null, limit: 8 });
  const memory = composeLibraryReading(query, hits, diagnosis);
  let reading = memory;
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
  const pulseId = state.nextPulseId++;
  state.pulses.push({ id: pulseId, kind: 'consult', query, reading, cardIds: hits.map((h) => h.id), organId: input?.organId ?? null, source, createdAt: new Date().toISOString() });
  state.lastPulseAt = new Date().toISOString();
  return { ok: true, source, reading, cardIds: hits.map((h) => h.id), pulseId, pulses: state.pulses, events: state.events };
}

module.exports = { bootOrganism, getOrganism, publishSpineEvent, consultLibrary };
