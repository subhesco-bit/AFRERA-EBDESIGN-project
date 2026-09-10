const m084Service = require('../service');

describe('M084', () => {
  test('should get all items', async () => {
    const result = await m084Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m084Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});