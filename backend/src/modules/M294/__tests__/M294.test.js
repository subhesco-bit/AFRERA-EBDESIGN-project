const m294Service = require('../service');

describe('M294', () => {
  test('should get all items', async () => {
    const result = await m294Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m294Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});