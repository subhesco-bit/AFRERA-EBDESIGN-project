const m216Service = require('../service');

describe('M216', () => {
  test('should get all items', async () => {
    const result = await m216Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m216Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});