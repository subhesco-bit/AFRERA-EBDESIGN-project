const m248Service = require('../service');

describe('M248', () => {
  test('should get all items', async () => {
    const result = await m248Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m248Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});