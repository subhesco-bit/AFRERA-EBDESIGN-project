const m088Service = require('../service');

describe('M088', () => {
  test('should get all items', async () => {
    const result = await m088Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m088Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});