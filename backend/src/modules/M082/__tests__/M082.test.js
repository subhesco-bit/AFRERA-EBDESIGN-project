const m082Service = require('../service');

describe('M082', () => {
  test('should get all items', async () => {
    const result = await m082Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m082Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});