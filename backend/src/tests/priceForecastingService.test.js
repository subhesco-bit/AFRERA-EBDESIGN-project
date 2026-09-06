jest.mock('../database/dbConnection', () => jest.fn());

const db = require('../database/dbConnection');
const service = require('../services/priceForecastingService');

describe('price forecasting', () => {
  test('produces reproducible data-derived forecasts', async () => {
    db.mockImplementation(() => ({
      where: () => ({
        orderBy: () => ({
          limit: async () => [
            { price: 120 },
            { price: 110 },
            { price: 100 },
          ],
        }),
      }),
    }));

    const first = await service.forecastProductPrice('rice', 3);
    const second = await service.forecastProductPrice('rice', 3);

    expect(first).toEqual(second);
    expect(first.forecast[0].forecasted_price).toBe(120);
    expect(first.forecast[0].confidence).toBeGreaterThan(0);
  });
});
