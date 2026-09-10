const m305Service = require('../service');

describe('M305', () => {
  test('should get all items', async () => {
    const result = await m305Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m305Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});