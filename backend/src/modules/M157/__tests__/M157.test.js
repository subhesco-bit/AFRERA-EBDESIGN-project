const m157Service = require('../service');

describe('M157', () => {
  test('should get all items', async () => {
    const result = await m157Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m157Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});