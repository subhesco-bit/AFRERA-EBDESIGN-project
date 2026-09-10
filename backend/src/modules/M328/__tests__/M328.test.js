const m328Service = require('../service');

describe('M328', () => {
  test('should get all items', async () => {
    const result = await m328Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m328Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});