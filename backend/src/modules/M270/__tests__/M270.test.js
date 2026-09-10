const m270Service = require('../service');

describe('M270', () => {
  test('should get all items', async () => {
    const result = await m270Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m270Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});