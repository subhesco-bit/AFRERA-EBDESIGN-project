const m292Service = require('../service');

describe('M292', () => {
  test('should get all items', async () => {
    const result = await m292Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m292Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});