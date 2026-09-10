const m158Service = require('../service');

describe('M158', () => {
  test('should get all items', async () => {
    const result = await m158Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m158Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});