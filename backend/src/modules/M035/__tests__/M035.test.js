const m035Service = require('../service');

describe('M035', () => {
  test('should get all items', async () => {
    const result = await m035Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m035Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});