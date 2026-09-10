const m182Service = require('../service');

describe('M182', () => {
  test('should get all items', async () => {
    const result = await m182Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m182Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});