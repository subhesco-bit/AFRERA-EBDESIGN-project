const express = require('express');
const request = require('supertest');

const publicDataRoutes = require('../routes/publicDomainDataExtractionRoutes_merged');
const startupRoutes = require('../routes/startupEnvironmentRoutes_merged');

function buildApp(route, mount) {
  return express().use(express.json()).use(mount, route);
}

describe('formerly unimplemented route contracts', () => {
  test('public-data extraction exposes source discovery and health', async () => {
    const app = buildApp(publicDataRoutes, '/public-data');

    const health = await request(app).get('/public-data/health').expect(200);
    expect(health.body.data).toHaveProperty('status');

    const sources = await request(app).get('/public-data/sources').expect(200);
    expect(Array.isArray(sources.body.data)).toBe(true);
    expect(sources.body.data.length).toBeGreaterThan(0);
  });

  test('startup environment exposes registration and lookup', async () => {
    const app = buildApp(startupRoutes, '/startup');
    const startup = {
      id: `test-startup-${Date.now()}`,
      name: 'Contract Test Startup',
      founder: 'Test Founder',
      email: 'startup-test@example.com',
    };

    const created = await request(app).post('/startup/startups').send(startup).expect(201);
    expect(created.body.data).toMatchObject({ id: startup.id, name: startup.name });

    const fetched = await request(app).get(`/startup/startups/${startup.id}`).expect(200);
    expect(fetched.body.data).toMatchObject({ id: startup.id, name: startup.name });
  });
});