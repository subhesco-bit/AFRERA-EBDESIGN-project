const m146Service = require('../service');

describe('M146', () => {
  test('should get all items', async () => {
    const result = await m146Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m146Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});