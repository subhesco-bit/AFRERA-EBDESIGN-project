const m277Service = require('../service');

describe('M277', () => {
  test('should get all items', async () => {
    const result = await m277Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m277Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});