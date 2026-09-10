const m252Service = require('../service');

describe('M252', () => {
  test('should get all items', async () => {
    const result = await m252Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m252Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});