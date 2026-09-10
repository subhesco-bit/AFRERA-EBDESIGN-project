const m265Service = require('../service');

describe('M265', () => {
  test('should get all items', async () => {
    const result = await m265Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m265Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});