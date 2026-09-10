const m267Service = require('../service');

describe('M267', () => {
  test('should get all items', async () => {
    const result = await m267Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m267Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});