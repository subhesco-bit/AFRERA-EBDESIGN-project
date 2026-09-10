const m286Service = require('../service');

describe('M286', () => {
  test('should get all items', async () => {
    const result = await m286Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m286Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});