const m291Service = require('../service');

describe('M291', () => {
  test('should get all items', async () => {
    const result = await m291Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m291Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});