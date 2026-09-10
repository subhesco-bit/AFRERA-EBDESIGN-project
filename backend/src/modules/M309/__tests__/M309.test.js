const m309Service = require('../service');

describe('M309', () => {
  test('should get all items', async () => {
    const result = await m309Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m309Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});