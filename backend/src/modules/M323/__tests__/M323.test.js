const m323Service = require('../service');

describe('M323', () => {
  test('should get all items', async () => {
    const result = await m323Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m323Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});