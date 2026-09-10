const m077Service = require('../service');

describe('M077', () => {
  test('should get all items', async () => {
    const result = await m077Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m077Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});