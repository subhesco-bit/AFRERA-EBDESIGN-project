const m322Service = require('../service');

describe('M322', () => {
  test('should get all items', async () => {
    const result = await m322Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m322Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});