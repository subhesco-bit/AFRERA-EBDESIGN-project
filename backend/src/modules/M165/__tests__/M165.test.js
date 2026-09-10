const m165Service = require('../service');

describe('M165', () => {
  test('should get all items', async () => {
    const result = await m165Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m165Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});