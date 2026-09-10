const m098Service = require('../service');

describe('M098', () => {
  test('should get all items', async () => {
    const result = await m098Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m098Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});