const m160Service = require('../service');

describe('M160', () => {
  test('should get all items', async () => {
    const result = await m160Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m160Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});