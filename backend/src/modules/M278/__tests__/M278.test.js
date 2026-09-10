const m278Service = require('../service');

describe('M278', () => {
  test('should get all items', async () => {
    const result = await m278Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m278Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});