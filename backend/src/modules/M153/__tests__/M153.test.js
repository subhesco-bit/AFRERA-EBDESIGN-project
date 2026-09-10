const m153Service = require('../service');

describe('M153', () => {
  test('should get all items', async () => {
    const result = await m153Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m153Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});