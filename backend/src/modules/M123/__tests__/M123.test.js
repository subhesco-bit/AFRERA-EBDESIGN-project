const m123Service = require('../service');

describe('M123', () => {
  test('should get all items', async () => {
    const result = await m123Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m123Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});