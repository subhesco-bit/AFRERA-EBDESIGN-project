const m193Service = require('../service');

describe('M193', () => {
  test('should get all items', async () => {
    const result = await m193Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m193Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});