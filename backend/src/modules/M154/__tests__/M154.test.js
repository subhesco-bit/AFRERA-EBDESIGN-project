const m154Service = require('../service');

describe('M154', () => {
  test('should get all items', async () => {
    const result = await m154Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m154Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});