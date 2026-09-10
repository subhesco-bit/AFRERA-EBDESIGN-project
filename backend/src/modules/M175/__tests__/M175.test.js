const m175Service = require('../service');

describe('M175', () => {
  test('should get all items', async () => {
    const result = await m175Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m175Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});