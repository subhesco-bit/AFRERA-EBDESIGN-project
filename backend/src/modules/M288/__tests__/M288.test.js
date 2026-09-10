const m288Service = require('../service');

describe('M288', () => {
  test('should get all items', async () => {
    const result = await m288Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m288Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});