const m274Service = require('../service');

describe('M274', () => {
  test('should get all items', async () => {
    const result = await m274Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m274Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});