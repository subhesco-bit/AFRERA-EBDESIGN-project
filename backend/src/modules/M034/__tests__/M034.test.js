const m034Service = require('../service');

describe('M034', () => {
  test('should get all items', async () => {
    const result = await m034Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m034Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});