const m343Service = require('../service');

describe('M343', () => {
  test('should get all items', async () => {
    const result = await m343Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m343Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});