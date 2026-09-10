const m155Service = require('../service');

describe('M155', () => {
  test('should get all items', async () => {
    const result = await m155Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m155Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});