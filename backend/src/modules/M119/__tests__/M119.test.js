const m119Service = require('../service');

describe('M119', () => {
  test('should get all items', async () => {
    const result = await m119Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m119Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});