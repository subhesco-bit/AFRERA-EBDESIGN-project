const m241Service = require('../service');

describe('M241', () => {
  test('should get all items', async () => {
    const result = await m241Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m241Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});