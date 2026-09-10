const m074Service = require('../service');

describe('M074', () => {
  test('should get all items', async () => {
    const result = await m074Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m074Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});