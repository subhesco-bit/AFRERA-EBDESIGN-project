const m078Service = require('../service');

describe('M078', () => {
  test('should get all items', async () => {
    const result = await m078Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m078Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});