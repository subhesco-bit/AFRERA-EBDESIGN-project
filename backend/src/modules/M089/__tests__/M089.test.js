const m089Service = require('../service');

describe('M089', () => {
  test('should get all items', async () => {
    const result = await m089Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m089Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});