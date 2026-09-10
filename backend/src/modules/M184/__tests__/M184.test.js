const m184Service = require('../service');

describe('M184', () => {
  test('should get all items', async () => {
    const result = await m184Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m184Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});