const m031Service = require('../service');

describe('M031', () => {
  test('should get all items', async () => {
    const result = await m031Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m031Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});