const m081Service = require('../service');

describe('M081', () => {
  test('should get all items', async () => {
    const result = await m081Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m081Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});