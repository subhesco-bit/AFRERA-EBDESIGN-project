const m115Service = require('../service');

describe('M115', () => {
  test('should get all items', async () => {
    const result = await m115Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m115Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});