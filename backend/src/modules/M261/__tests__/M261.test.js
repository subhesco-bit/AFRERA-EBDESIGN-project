const m261Service = require('../service');

describe('M261', () => {
  test('should get all items', async () => {
    const result = await m261Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m261Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});