const m141Service = require('../service');

describe('M141', () => {
  test('should get all items', async () => {
    const result = await m141Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m141Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});