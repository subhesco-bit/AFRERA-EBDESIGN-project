const m149Service = require('../service');

describe('M149', () => {
  test('should get all items', async () => {
    const result = await m149Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m149Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});