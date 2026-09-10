const m341Service = require('../service');

describe('M341', () => {
  test('should get all items', async () => {
    const result = await m341Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m341Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});