const m094Service = require('../service');

describe('M094', () => {
  test('should get all items', async () => {
    const result = await m094Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m094Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});