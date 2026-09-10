const m246Service = require('../service');

describe('M246', () => {
  test('should get all items', async () => {
    const result = await m246Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m246Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});