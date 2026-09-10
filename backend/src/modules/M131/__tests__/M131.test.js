const m131Service = require('../service');

describe('M131', () => {
  test('should get all items', async () => {
    const result = await m131Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m131Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});