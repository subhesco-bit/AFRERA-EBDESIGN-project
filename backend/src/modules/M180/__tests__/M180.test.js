const m180Service = require('../service');

describe('M180', () => {
  test('should get all items', async () => {
    const result = await m180Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m180Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});