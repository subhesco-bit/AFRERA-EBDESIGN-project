const m140Service = require('../service');

describe('M140', () => {
  test('should get all items', async () => {
    const result = await m140Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m140Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});