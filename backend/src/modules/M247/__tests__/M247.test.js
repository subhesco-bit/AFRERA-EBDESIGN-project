const m247Service = require('../service');

describe('M247', () => {
  test('should get all items', async () => {
    const result = await m247Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m247Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});