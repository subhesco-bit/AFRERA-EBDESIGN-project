const m069Service = require('../service');

describe('M069', () => {
  test('should get all items', async () => {
    const result = await m069Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m069Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});