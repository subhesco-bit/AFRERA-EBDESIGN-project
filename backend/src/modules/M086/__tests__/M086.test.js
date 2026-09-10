const m086Service = require('../service');

describe('M086', () => {
  test('should get all items', async () => {
    const result = await m086Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m086Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});