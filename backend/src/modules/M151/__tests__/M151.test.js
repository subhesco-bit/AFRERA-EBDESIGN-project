const m151Service = require('../service');

describe('M151', () => {
  test('should get all items', async () => {
    const result = await m151Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m151Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});