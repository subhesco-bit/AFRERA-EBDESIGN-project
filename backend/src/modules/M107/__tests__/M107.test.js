const m107Service = require('../service');

describe('M107', () => {
  test('should get all items', async () => {
    const result = await m107Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m107Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});