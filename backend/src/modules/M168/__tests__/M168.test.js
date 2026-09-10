const m168Service = require('../service');

describe('M168', () => {
  test('should get all items', async () => {
    const result = await m168Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m168Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});