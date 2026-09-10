const m100Service = require('../service');

describe('M100', () => {
  test('should get all items', async () => {
    const result = await m100Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m100Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});