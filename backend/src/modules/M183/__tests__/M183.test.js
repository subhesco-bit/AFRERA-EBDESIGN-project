const m183Service = require('../service');

describe('M183', () => {
  test('should get all items', async () => {
    const result = await m183Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m183Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});