const m033Service = require('../service');

describe('M033', () => {
  test('should get all items', async () => {
    const result = await m033Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m033Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});