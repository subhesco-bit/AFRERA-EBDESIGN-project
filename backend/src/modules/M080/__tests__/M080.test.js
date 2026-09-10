const m080Service = require('../service');

describe('M080', () => {
  test('should get all items', async () => {
    const result = await m080Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m080Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});