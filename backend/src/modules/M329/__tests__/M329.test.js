const m329Service = require('../service');

describe('M329', () => {
  test('should get all items', async () => {
    const result = await m329Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m329Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});