const m104Service = require('../service');

describe('M104', () => {
  test('should get all items', async () => {
    const result = await m104Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m104Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});