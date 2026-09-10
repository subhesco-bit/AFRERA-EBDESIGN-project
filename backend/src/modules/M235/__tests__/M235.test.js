const m235Service = require('../service');

describe('M235', () => {
  test('should get all items', async () => {
    const result = await m235Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m235Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});