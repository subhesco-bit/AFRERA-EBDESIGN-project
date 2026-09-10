const m147Service = require('../service');

describe('M147', () => {
  test('should get all items', async () => {
    const result = await m147Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m147Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});