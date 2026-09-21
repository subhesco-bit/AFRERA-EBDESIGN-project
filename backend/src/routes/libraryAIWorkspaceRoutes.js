'use strict';

const express = require('express');
const libraryAIWorkspaceService = require('../services/libraryAIWorkspaceService');
const { logger } = require('../utils/logger');

const router = express.Router();

function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

function fail(res, error, status = 500) {
  logger.warn('Library AI workspace route failed', { error: error.message });
  return res.status(status).json({
    success: false,
    error: {
      code: 'LIBRARY_AI_WORKSPACE_ERROR',
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  });
}

router.get('/status', (_req, res) => {
  try {
    return ok(res, libraryAIWorkspaceService.getStatus());
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/orchestrator/status', (_req, res) => {
  try {
    return ok(res, libraryAIWorkspaceService.getOrchestratorStatus());
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/orchestrator/groups/search', async (req, res) => {
  try {
    const rows = await libraryAIWorkspaceService.searchOrchestratorGroups(req.query);
    return ok(res, { rows, returned: rows.length });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/orchestrator/tasks', async (req, res) => {
  try {
    const rows = await libraryAIWorkspaceService.searchOrchestratorAssignments(req.query);
    return ok(res, { rows, returned: rows.length });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/files/search', async (req, res) => {
  try {
    const rows = await libraryAIWorkspaceService.searchFiles(req.query);
    return ok(res, {
      rows,
      returned: rows.length,
      query: req.query.query || req.query.q || '',
    });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/files/:libraryId', async (req, res) => {
  try {
    const file = await libraryAIWorkspaceService.findByLibraryId(req.params.libraryId);
    if (!file) return fail(res, new Error('library_id not found'), 404);
    return ok(res, file);
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/files/:libraryId/content', async (req, res) => {
  try {
    const result = await libraryAIWorkspaceService.readFileContent(req.params.libraryId, req.query);
    if (!result.found) return fail(res, new Error('library_id not found'), 404);
    if (!result.readable) return ok(res, result, 200);
    return ok(res, result);
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/context', async (req, res) => {
  try {
    const workspace = await libraryAIWorkspaceService.buildWorkspace(req.body || {});
    return ok(res, workspace);
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/improvement-workspace', async (req, res) => {
  try {
    const workspace = await libraryAIWorkspaceService.buildWorkspace({
      ...(req.body || {}),
      objective: req.body?.objective || 'Project improvement using the active Library',
    });
    return ok(res, workspace);
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/events', (req, res) => {
  try {
    const event = libraryAIWorkspaceService.recordAgentEvent(req.body || {});
    return ok(res, event, 201);
  } catch (error) {
    return fail(res, error);
  }
});

module.exports = router;
