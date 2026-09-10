const m133Service = require('../service');

describe('M133', () => {
  test('should get all items', async () => {
    const result = await m133Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m133Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});