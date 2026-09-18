#!/usr/bin/env node
/**
 * Focused Library Operations server.
 *
 * The full AFRERA backend initializes many enterprise services. This focused
 * server starts only the operational library API so the project library can be
 * browsed, searched, verified, and used as AI context immediately.
 */

'use strict';

const path = require('path');

const root = process.cwd();
const backendRoot = path.join(root, 'backend');
const express = require(require.resolve('express', { paths: [backendRoot] }));
const cors = require(require.resolve('cors', { paths: [backendRoot] }));
const helmet = require(require.resolve('helmet', { paths: [backendRoot] }));
const compression = require(require.resolve('compression', { paths: [backendRoot] }));
const libraryRoutes = require('../backend/src/routes/libraryRoutes');
const libraryAIWorkspaceRoutes = require('../backend/src/routes/libraryAIWorkspaceRoutes');
const libraryKnowledgeService = require('../backend/src/services/libraryKnowledgeService');

const app = express();
const port = Number(process.env.LIBRARY_PORT || process.env.PORT || 3100);

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(compression());

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'codex-library-ops-server',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/library', libraryRoutes);
app.use('/api/library-knowledge', libraryRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/library-ai-workspace', libraryAIWorkspaceRoutes);
app.use('/api/ai/library-workspace', libraryAIWorkspaceRoutes);
app.use('/api/v1/ai/library-workspace', libraryAIWorkspaceRoutes);

async function start() {
  const init = await libraryKnowledgeService.initialize({ syncDatabase: false });
  app.locals.libraryKnowledgeService = libraryKnowledgeService;

  app.listen(port, () => {
    console.log(JSON.stringify({
      status: 'running',
      service: 'codex-library-ops-server',
      port,
      urls: {
        health: `http://127.0.0.1:${port}/health`,
        statistics: `http://127.0.0.1:${port}/api/library/statistics`,
        modules: `http://127.0.0.1:${port}/api/library/modules`,
        search: `http://127.0.0.1:${port}/api/library/search?query=farmer`,
        aiContext: `http://127.0.0.1:${port}/api/library/ai-context`,
        workspace: `http://127.0.0.1:${port}/api/ai/library-workspace/status`,
      },
      indexedItems: init.indexedItems,
      contentHashes: init.contentHashes,
      indexingWarnings: init.indexingWarnings,
    }, null, 2));
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
