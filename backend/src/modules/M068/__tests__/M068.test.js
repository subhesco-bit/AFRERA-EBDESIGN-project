const m068Service = require('../service');

describe('M068', () => {
  test('should get all items', async () => {
    const result = await m068Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m068Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});