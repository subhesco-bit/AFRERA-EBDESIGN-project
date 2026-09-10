const m132Service = require('../service');

describe('M132', () => {
  test('should get all items', async () => {
    const result = await m132Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m132Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});