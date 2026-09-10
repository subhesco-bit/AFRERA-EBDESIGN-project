const m220Service = require('../service');

describe('M220', () => {
  test('should get all items', async () => {
    const result = await m220Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m220Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});