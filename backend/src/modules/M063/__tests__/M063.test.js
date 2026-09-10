const m063Service = require('../service');

describe('M063', () => {
  test('should get all items', async () => {
    const result = await m063Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m063Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});