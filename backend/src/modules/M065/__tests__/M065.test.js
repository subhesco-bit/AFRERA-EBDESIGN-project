const m065Service = require('../service');

describe('M065', () => {
  test('should get all items', async () => {
    const result = await m065Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m065Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});