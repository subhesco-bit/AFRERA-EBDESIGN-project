const m332Service = require('../service');

describe('M332', () => {
  test('should get all items', async () => {
    const result = await m332Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m332Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});