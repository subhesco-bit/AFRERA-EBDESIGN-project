const m169Service = require('../service');

describe('M169', () => {
  test('should get all items', async () => {
    const result = await m169Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m169Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});