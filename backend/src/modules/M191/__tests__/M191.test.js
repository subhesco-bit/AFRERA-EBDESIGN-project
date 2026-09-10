const m191Service = require('../service');

describe('M191', () => {
  test('should get all items', async () => {
    const result = await m191Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m191Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});