const m129Service = require('../service');

describe('M129', () => {
  test('should get all items', async () => {
    const result = await m129Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m129Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});