const m285Service = require('../service');

describe('M285', () => {
  test('should get all items', async () => {
    const result = await m285Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m285Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});