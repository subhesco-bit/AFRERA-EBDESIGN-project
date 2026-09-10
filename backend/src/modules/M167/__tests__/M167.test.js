const m167Service = require('../service');

describe('M167', () => {
  test('should get all items', async () => {
    const result = await m167Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m167Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});