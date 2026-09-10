const m139Service = require('../service');

describe('M139', () => {
  test('should get all items', async () => {
    const result = await m139Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m139Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});