const m076Service = require('../service');

describe('M076', () => {
  test('should get all items', async () => {
    const result = await m076Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m076Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});