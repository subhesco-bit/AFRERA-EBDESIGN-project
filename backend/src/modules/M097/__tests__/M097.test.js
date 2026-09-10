const m097Service = require('../service');

describe('M097', () => {
  test('should get all items', async () => {
    const result = await m097Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m097Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});