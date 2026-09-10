const m059Service = require('../service');

describe('M059', () => {
  test('should get all items', async () => {
    const result = await m059Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m059Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});