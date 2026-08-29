/**
 * Devin (Cognition) Live Integration
 *
 * Real calls against Devin's session API (https://docs.devin.ai/api-reference).
 * Unlike the synchronous LLM providers in aiBackboneService.js, Devin is
 * agentic and asynchronous: creating a session kicks off work that can take
 * minutes to hours, so callers must poll getSession() for status rather than
 * expect a completion in the response.
 *
 * Session creation is recorded as a handoff in the existing Claude/Devin
 * collaboration log (.ai/handoffs.json via aiCollaborationService), and a
 * finished session is logged back so the next Claude session can see it -
 * this is what actually closes the "no real-time automation" gap between
 * the two agents.
 *
 * FILE TRANSFER MANIFEST: when a Devin session finishes with an attached
 * pull request, buildTransferManifest() pulls the exact file list from
 * GitHub's PR Files API (path, status, +/- lines, diff patch) and writes it
 * to .ai/handoffs/transfers/{sessionId}.json. That file is the "transfer
 * interface" - Claude (or any reviewer) reads one structured manifest to
 * know precisely what Devin produced, instead of diffing/searching the repo
 * to figure out what changed.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { logger } = require('../utils/logger');
const aiCollaborationService = require('./aiCollaborationService');

const DEVIN_CONFIG = {
  enabled: process.env.DEVIN_ENABLED === 'true',
  apiKey: process.env.DEVIN_API_KEY,
  baseUrl: process.env.DEVIN_BASE_URL || 'https://api.devin.ai/v1'
};

const TRANSFER_DIR = path.join(__dirname, '../../../.ai/handoffs/transfers');

function assertConfigured() {
  if (!DEVIN_CONFIG.enabled || !DEVIN_CONFIG.apiKey) {
    throw new Error('Devin is not configured');
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEVIN_CONFIG.apiKey}`
  };
}

function ensureTransferDir() {
  if (!fs.existsSync(TRANSFER_DIR)) {
    fs.mkdirSync(TRANSFER_DIR, { recursive: true });
  }
}

function githubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ebdesign-devin-integration'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parsePullRequestUrl(prUrl) {
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error(`Could not parse GitHub PR URL: ${prUrl}`);
  }
  return { owner: match[1], repo: match[2], number: match[3] };
}

/**
 * Build a systematic, structured file-transfer manifest from a Devin PR:
 * exactly which files were added/modified/removed, with diff stats and the
 * patch itself, written to .ai/handoffs/transfers/{sessionId}.json.
 */
async function buildTransferManifest(session) {
  const prUrl = session.pullRequest?.url;
  if (!prUrl) {
    throw new Error('Session has no pull request to build a transfer manifest from');
  }

  const { owner, repo, number } = parsePullRequestUrl(prUrl);

  const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, {
    headers: githubHeaders()
  });
  if (!prResponse.ok) {
    throw new Error(`GitHub API error fetching PR: ${prResponse.status} - ${await prResponse.text()}`);
  }
  const pr = await prResponse.json();

  const files = [];
  let page = 1;
  // GitHub paginates PR files at 100/page; loop until a short page ends it.
  while (true) {
    const filesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
      { headers: githubHeaders() }
    );
    if (!filesResponse.ok) {
      throw new Error(`GitHub API error fetching PR files: ${filesResponse.status} - ${await filesResponse.text()}`);
    }
    const pageFiles = await filesResponse.json();
    files.push(...pageFiles.map(f => ({
      path: f.filename,
      previousPath: f.previous_filename || null,
      status: f.status, // added | modified | removed | renamed
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch || null
    })));
    if (pageFiles.length < 100) break;
    page++;
  }

  const manifest = {
    sessionId: session.sessionId,
    source: 'devin',
    generatedAt: new Date().toISOString(),
    pullRequest: {
      url: pr.html_url,
      number: pr.number,
      title: pr.title,
      baseBranch: pr.base?.ref,
      headBranch: pr.head?.ref,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files
    },
    files
  };

  ensureTransferDir();
  const manifestPath = path.join(TRANSFER_DIR, `${session.sessionId}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  logger.info('Devin transfer manifest built', {
    sessionId: session.sessionId,
    fileCount: files.length,
    manifestPath
  });

  return { manifest, manifestPath };
}

/**
 * Read a previously-built manifest from disk, if one exists.
 */
function readTransferManifest(sessionId) {
  const manifestPath = path.join(TRANSFER_DIR, `${sessionId}.json`);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return { manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')), manifestPath };
}

/**
 * Get the transfer manifest for a session - cached copy unless forceRebuild,
 * or built fresh (from a live getSession() call) if none exists yet.
 */
async function getTransferManifest(sessionId, { forceRebuild = false } = {}) {
  if (!forceRebuild) {
    const cached = readTransferManifest(sessionId);
    if (cached) return cached;
  }

  const session = await getSession(sessionId);
  return buildTransferManifest(session);
}

/**
 * Kick off a new Devin session.
 * POST /v1/sessions
 */
async function createSession(prompt, options = {}) {
  assertConfigured();

  const body = {
    prompt,
    ...(options.snapshotId && { snapshot_id: options.snapshotId }),
    ...(options.title && { title: options.title }),
    ...(options.playbookId && { playbook_id: options.playbookId }),
    ...(options.knowledgeIds && { knowledge_ids: options.knowledgeIds }),
    ...(options.secretIds && { secret_ids: options.secretIds }),
    ...(options.sessionSecrets && { session_secrets: options.sessionSecrets }),
    ...(options.maxAcuLimit && { max_acu_limit: options.maxAcuLimit }),
    ...(options.structuredOutputSchema && { structured_output_schema: options.structuredOutputSchema }),
    ...(options.tags && { tags: options.tags }),
    ...(options.idempotent !== undefined && { idempotent: options.idempotent }),
    ...(options.unlisted !== undefined && { unlisted: options.unlisted })
  };

  const response = await fetch(`${DEVIN_CONFIG.baseUrl}/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Devin API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  logger.info('Devin session created', { sessionId: data.session_id, url: data.url });

  try {
    await aiCollaborationService.createHandoff('claude', 'devin', {
      work_type: 'devin_session',
      description: prompt,
      session_id: data.session_id,
      session_url: data.url
    });
  } catch (handoffError) {
    logger.warn('Devin session created but failed to record handoff', { error: handoffError.message });
  }

  return {
    provider: 'devin',
    sessionId: data.session_id,
    url: data.url,
    isNewSession: data.is_new_session
  };
}

/**
 * Get the current status/details of a Devin session.
 * GET /v1/sessions/{session_id}
 */
async function getSession(sessionId) {
  assertConfigured();

  const response = await fetch(`${DEVIN_CONFIG.baseUrl}/sessions/${sessionId}`, {
    method: 'GET',
    headers: authHeaders()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Devin API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (data.status_enum === 'finished') {
    try {
      await aiCollaborationService.logWork('devin', {
        work_type: 'devin_session',
        description: data.title || `Session ${sessionId} finished`,
        session_id: sessionId,
        status: 'completed',
        files_affected: data.pull_request?.url ? [data.pull_request.url] : []
      });
    } catch (logError) {
      logger.warn('Failed to log completed Devin session', { error: logError.message });
    }
  }

  return {
    sessionId: data.session_id,
    status: data.status,
    statusEnum: data.status_enum,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    messages: data.messages,
    structuredOutput: data.structured_output,
    pullRequest: data.pull_request,
    playbookId: data.playbook_id,
    snapshotId: data.snapshot_id,
    title: data.title,
    tags: data.tags
  };
}

/**
 * Send a follow-up message to a running Devin session.
 * POST /v1/sessions/{session_id}/message
 */
async function sendMessage(sessionId, message) {
  assertConfigured();

  const response = await fetch(`${DEVIN_CONFIG.baseUrl}/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Devin API error: ${response.status} - ${error}`);
  }

  logger.info('Message sent to Devin session', { sessionId });

  return { success: true, sessionId };
}

/**
 * Get Devin configuration/connectivity status (no secrets exposed).
 */
function getStatus() {
  return {
    provider: 'devin',
    enabled: DEVIN_CONFIG.enabled,
    configured: DEVIN_CONFIG.enabled && Boolean(DEVIN_CONFIG.apiKey),
    baseUrl: DEVIN_CONFIG.baseUrl
  };
}

module.exports = {
  createSession,
  getSession,
  sendMessage,
  getStatus,
  DEVIN_CONFIG
};
