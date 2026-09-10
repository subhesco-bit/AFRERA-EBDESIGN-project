const m289Service = require('../service');

describe('M289', () => {
  test('should get all items', async () => {
    const result = await m289Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m289Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});