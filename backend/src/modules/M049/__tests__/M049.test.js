const m049Service = require('../service');

describe('M049', () => {
  test('should get all items', async () => {
    const result = await m049Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m049Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});