const m339Service = require('../service');

describe('M339', () => {
  test('should get all items', async () => {
    const result = await m339Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m339Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});