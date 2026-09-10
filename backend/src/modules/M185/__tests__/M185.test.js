const m185Service = require('../service');

describe('M185', () => {
  test('should get all items', async () => {
    const result = await m185Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m185Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});