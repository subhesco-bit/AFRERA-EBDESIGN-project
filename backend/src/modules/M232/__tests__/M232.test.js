const m232Service = require('../service');

describe('M232', () => {
  test('should get all items', async () => {
    const result = await m232Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m232Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});