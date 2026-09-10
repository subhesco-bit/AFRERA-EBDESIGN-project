const m300Service = require('../service');

describe('M300', () => {
  test('should get all items', async () => {
    const result = await m300Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m300Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});