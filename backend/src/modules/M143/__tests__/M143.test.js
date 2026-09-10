const m143Service = require('../service');

describe('M143', () => {
  test('should get all items', async () => {
    const result = await m143Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m143Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});