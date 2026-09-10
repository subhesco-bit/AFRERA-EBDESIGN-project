const m186Service = require('../service');

describe('M186', () => {
  test('should get all items', async () => {
    const result = await m186Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m186Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});