const m117Service = require('../service');

describe('M117', () => {
  test('should get all items', async () => {
    const result = await m117Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m117Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});