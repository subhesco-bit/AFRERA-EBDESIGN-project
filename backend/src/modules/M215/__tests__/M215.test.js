const m215Service = require('../service');

describe('M215', () => {
  test('should get all items', async () => {
    const result = await m215Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m215Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});