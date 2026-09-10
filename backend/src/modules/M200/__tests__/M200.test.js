const m200Service = require('../service');

describe('M200', () => {
  test('should get all items', async () => {
    const result = await m200Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m200Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});