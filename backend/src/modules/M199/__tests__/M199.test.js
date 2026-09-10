const m199Service = require('../service');

describe('M199', () => {
  test('should get all items', async () => {
    const result = await m199Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m199Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});