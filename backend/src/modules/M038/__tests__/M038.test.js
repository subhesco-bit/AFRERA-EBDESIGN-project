const m038Service = require('../service');

describe('M038', () => {
  test('should get all items', async () => {
    const result = await m038Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m038Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});