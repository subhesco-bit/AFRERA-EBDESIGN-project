const m118Service = require('../service');

describe('M118', () => {
  test('should get all items', async () => {
    const result = await m118Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m118Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});