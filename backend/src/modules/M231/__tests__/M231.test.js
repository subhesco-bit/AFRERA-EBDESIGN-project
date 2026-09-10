const m231Service = require('../service');

describe('M231', () => {
  test('should get all items', async () => {
    const result = await m231Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m231Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});