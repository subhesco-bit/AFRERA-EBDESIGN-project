const m108Service = require('../service');

describe('M108', () => {
  test('should get all items', async () => {
    const result = await m108Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m108Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});