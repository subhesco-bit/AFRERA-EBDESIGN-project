const m093Service = require('../service');

describe('M093', () => {
  test('should get all items', async () => {
    const result = await m093Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m093Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});