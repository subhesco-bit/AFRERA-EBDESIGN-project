const m293Service = require('../service');

describe('M293', () => {
  test('should get all items', async () => {
    const result = await m293Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m293Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});