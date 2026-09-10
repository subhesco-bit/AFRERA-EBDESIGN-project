const m127Service = require('../service');

describe('M127', () => {
  test('should get all items', async () => {
    const result = await m127Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m127Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});