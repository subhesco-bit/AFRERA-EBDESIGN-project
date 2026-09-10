const m040Service = require('../service');

describe('M040', () => {
  test('should get all items', async () => {
    const result = await m040Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m040Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});