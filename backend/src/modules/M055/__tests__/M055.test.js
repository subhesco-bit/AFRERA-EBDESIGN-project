const m055Service = require('../service');

describe('M055', () => {
  test('should get all items', async () => {
    const result = await m055Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m055Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});