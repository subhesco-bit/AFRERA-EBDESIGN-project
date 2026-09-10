const m336Service = require('../service');

describe('M336', () => {
  test('should get all items', async () => {
    const result = await m336Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m336Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});