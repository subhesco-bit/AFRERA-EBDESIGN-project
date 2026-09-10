const m041Service = require('../service');

describe('M041', () => {
  test('should get all items', async () => {
    const result = await m041Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m041Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});