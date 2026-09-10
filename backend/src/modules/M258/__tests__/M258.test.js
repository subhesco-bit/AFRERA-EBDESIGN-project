const m258Service = require('../service');

describe('M258', () => {
  test('should get all items', async () => {
    const result = await m258Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m258Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});