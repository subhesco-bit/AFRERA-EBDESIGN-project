const m314Service = require('../service');

describe('M314', () => {
  test('should get all items', async () => {
    const result = await m314Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m314Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});