const m295Service = require('../service');

describe('M295', () => {
  test('should get all items', async () => {
    const result = await m295Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m295Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});