const m263Service = require('../service');

describe('M263', () => {
  test('should get all items', async () => {
    const result = await m263Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m263Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});