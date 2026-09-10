const m128Service = require('../service');

describe('M128', () => {
  test('should get all items', async () => {
    const result = await m128Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m128Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});