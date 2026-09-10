const m249Service = require('../service');

describe('M249', () => {
  test('should get all items', async () => {
    const result = await m249Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m249Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});