'use strict';

// weatherAdvisoryService used to return Math.random()-generated
// temperature/humidity/rainfall/wind_speed and a hardcoded "5-day clear
// skies" forecast string for every location, presented as a real weather
// advisory. No real weather data source is configured anywhere in this
// codebase, so it now honestly reports {configured: false} instead. These
// tests assert that honesty, and that checkAlerts() no longer evaluates
// fabricated/absent data as if it were real.

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const weatherAdvisoryService = require('../weatherAdvisoryService');

describe('weatherAdvisoryService.getWeatherAdvisory', () => {
  test('honestly reports not configured instead of fabricating weather data', async () => {
    const result = await weatherAdvisoryService.getWeatherAdvisory(26.2, 92.9);

    expect(result).toEqual({
      location: { lat: 26.2, lng: 92.9 },
      configured: false,
      reason: expect.any(String),
    });
    expect(result).not.toHaveProperty('temperature');
    expect(result).not.toHaveProperty('humidity');
    expect(result).not.toHaveProperty('rainfall');
    expect(result).not.toHaveProperty('forecast');
  });
});

describe('weatherAdvisoryService.checkAlerts', () => {
  test('reports status unknown when given a not-configured forecast, without evaluating thresholds', async () => {
    const notConfigured = await weatherAdvisoryService.getWeatherAdvisory(26.2, 92.9);
    const result = await weatherAdvisoryService.checkAlerts(notConfigured);

    expect(result).toEqual({ alerts: [], status: 'unknown', reason: expect.any(String) });
  });

  test('evaluates real thresholds when given real-shaped forecast data', async () => {
    const result = await weatherAdvisoryService.checkAlerts({ rainfall: 40, temperature: 42 });

    expect(result.status).toBe('alert');
    expect(result.alerts).toEqual(
      expect.arrayContaining(['Heavy rainfall warning', 'Heat stress alert']),
    );
  });

  test('reports normal status when thresholds are not crossed', async () => {
    const result = await weatherAdvisoryService.checkAlerts({ rainfall: 5, temperature: 28 });

    expect(result).toEqual({ alerts: [], status: 'normal' });
  });
});

describe('weatherAdvisoryService.generateCropAdvisory', () => {
  test('returns known static advisory for a recognized crop', async () => {
    const result = await weatherAdvisoryService.generateCropAdvisory({}, 'rice');
    expect(result).toEqual({ crop: 'rice', advisory: 'Optimal conditions for transplanting' });
  });

  test('falls back to a generic advisory for an unrecognized crop', async () => {
    const result = await weatherAdvisoryService.generateCropAdvisory({}, 'dragonfruit');
    expect(result).toEqual({ crop: 'dragonfruit', advisory: 'Monitor conditions' });
  });
});
