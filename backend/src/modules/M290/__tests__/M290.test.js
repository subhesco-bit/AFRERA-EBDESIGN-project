const m290Service = require('../service');

describe('M290', () => {
  test('should get all items', async () => {
    const result = await m290Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m290Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});