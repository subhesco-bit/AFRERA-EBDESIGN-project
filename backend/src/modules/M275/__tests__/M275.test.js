const m275Service = require('../service');

describe('M275', () => {
  test('should get all items', async () => {
    const result = await m275Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m275Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});