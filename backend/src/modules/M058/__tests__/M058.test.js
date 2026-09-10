const m058Service = require('../service');

describe('M058', () => {
  test('should get all items', async () => {
    const result = await m058Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m058Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});