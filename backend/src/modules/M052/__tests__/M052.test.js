const m052Service = require('../service');

describe('M052', () => {
  test('should get all items', async () => {
    const result = await m052Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m052Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});