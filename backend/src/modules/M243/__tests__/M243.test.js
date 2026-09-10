const m243Service = require('../service');

describe('M243', () => {
  test('should get all items', async () => {
    const result = await m243Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m243Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});