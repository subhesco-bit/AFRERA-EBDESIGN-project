const m087Service = require('../service');

describe('M087', () => {
  test('should get all items', async () => {
    const result = await m087Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m087Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});