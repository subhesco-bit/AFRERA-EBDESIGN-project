const m125Service = require('../service');

describe('M125', () => {
  test('should get all items', async () => {
    const result = await m125Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m125Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});