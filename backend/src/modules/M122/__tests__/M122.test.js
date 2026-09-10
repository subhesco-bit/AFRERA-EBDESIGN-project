const m122Service = require('../service');

describe('M122', () => {
  test('should get all items', async () => {
    const result = await m122Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m122Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});