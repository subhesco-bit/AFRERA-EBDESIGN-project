const m114Service = require('../service');

describe('M114', () => {
  test('should get all items', async () => {
    const result = await m114Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m114Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});