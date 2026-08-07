#!/usr/bin/env node
/**
 * Generate openapi.json from the live Express route definitions.
 *
 * WHY THIS IS GENERATED, NOT HAND-WRITTEN
 * The repository already contained DOCUMENTATION/Volume_11B_API_Specifications.md,
 * but prose drifts from code the moment a route changes. This script reads the
 * actual `router.<verb>('<path>', ...middleware...)` declarations in
 * backend/src/services/*.js and backend/src/routes/*.js, resolves each router's
 * mount prefix from index.js, and emits a machine-readable contract.
 *
 * Accuracy boundary — stated plainly:
 *   ACCURATE: paths, HTTP verbs, path parameters, and whether an operation
 *             requires authentication / admin role (read from the middleware).
 *   GENERIC : request and response bodies. The handlers declare no schemas, so
 *             anything more specific here would be invention, not documentation.
 *             Add real schemas as validation is introduced (the codebase already
 *             depends on joi and express-validator).
 *
 * Usage:  node scripts/generate-openapi.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'openapi.json');

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

function resolveMounts() {
  const idx = fs.readFileSync(path.join(SRC, 'index.js'), 'utf8');
  const varToFile = {};
  for (const m of idx.matchAll(/const (\w+) = require\('\.\/(services|routes)\/([\w]+)'\)/g)) {
    varToFile[m[1]] = `${m[2]}/${m[3]}.js`;
  }
  const prefixForFile = {};
  const assign = (variable, prefix) => {
    const f = varToFile[variable];
    if (f) prefixForFile[f] = prefix;
  };
  for (const m of idx.matchAll(/mountRoute\('([^']+)',\s*(\w+)\)/g)) assign(m[2], m[1]);
  for (const m of idx.matchAll(/app\.use\('([^']+)',\s*(\w+)\)/g)) {
    if (!['rateLimiter', 'express', 'errorHandler'].includes(m[2])) assign(m[2], m[1]);
  }
  return prefixForFile;
}

function build() {
  const prefixForFile = resolveMounts();
  const files = [...listFiles(path.join(SRC, 'services')), ...listFiles(path.join(SRC, 'routes'))].sort();

  const paths = {};
  const tags = new Set();
  let total = 0;

  for (const file of files) {
    const rel = `${path.basename(path.dirname(file))}/${path.basename(file)}`;
    const prefix = prefixForFile[rel];
    const tag = path.basename(file, '.js');
    const src = fs.readFileSync(file, 'utf8');

    const re = /^\s*(?:router|app)\.(get|post|put|delete|patch)\(\s*'([^']*)'\s*,(.*)$/gm;
    for (const m of src.matchAll(re)) {
      const [, verb, route, rest] = m;

      let full;
      if (route.startsWith('/api/')) full = route;               // self-registered on app
      else if (prefix) full = route === '/' ? prefix : prefix.replace(/\/$/, '') + route;
      else continue;                                              // router never mounted

      total++;
      tags.add(tag);

      const secured = /authMiddleware|adminMiddleware|lazyAuth/.test(rest);
      const admin = /adminMiddleware/.test(rest);
      const openapiPath = full.replace(/:(\w+)/g, '{$1}');
      const params = [...full.matchAll(/:(\w+)/g)].map((p) => ({
        name: p[1], in: 'path', required: true, schema: { type: 'string' }
      }));

      const op = {
        tags: [tag],
        summary: `${verb.toUpperCase()} ${openapiPath}`,
        operationId: `${tag}_${verb}_${full.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
        responses: {
          200: { description: 'Success' },
          400: { description: 'Bad request' },
          500: { description: 'Server error' }
        }
      };
      if (params.length) op.parameters = params;
      if (secured) {
        op.security = [{ bearerAuth: [] }];
        op.responses[401] = { description: 'Unauthenticated' };
        if (admin) op.responses[403] = { description: 'Admin role required' };
      }
      if (['post', 'put', 'patch'].includes(verb)) {
        op.requestBody = { content: { 'application/json': { schema: { type: 'object' } } } };
      }

      paths[openapiPath] = paths[openapiPath] || {};
      paths[openapiPath][verb] = op;
    }
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'AFRERA Platform API',
      version: '1.0.0',
      description:
        'Machine-readable API contract for the AFRERA platform, GENERATED from the live ' +
        'Express route definitions in backend/src.\n\n' +
        'Regenerate with: node scripts/generate-openapi.js\n\n' +
        'Paths, verbs, path parameters and auth requirements are read from the code and are ' +
        'accurate. Request/response bodies are generic objects because the handlers declare no ' +
        'schemas — documenting anything more specific would be invention.',
      contact: { name: 'Ethnoverde Dynamics Pvt. Ltd.' },
      license: { name: 'PROPRIETARY' }
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'https://api.afrera.com', description: 'Production' }
    ],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
    },
    tags: [...tags].sort().map((t) => ({ name: t })),
    paths: Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)))
  };

  fs.writeFileSync(OUT, JSON.stringify(spec, null, 2));
  const secured = Object.values(paths).flatMap((p) => Object.values(p)).filter((o) => o.security).length;
  console.log(`openapi.json written: ${total} operations, ${Object.keys(paths).length} paths, ${secured} secured`);
}

build();
