const m302Service = require('../service');

describe('M302', () => {
  test('should get all items', async () => {
    const result = await m302Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m302Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});