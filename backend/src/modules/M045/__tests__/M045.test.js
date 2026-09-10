const m045Service = require('../service');

describe('M045', () => {
  test('should get all items', async () => {
    const result = await m045Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m045Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});