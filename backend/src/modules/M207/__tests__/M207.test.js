const m207Service = require('../service');

describe('M207', () => {
  test('should get all items', async () => {
    const result = await m207Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m207Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});