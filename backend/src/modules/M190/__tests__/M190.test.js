const m190Service = require('../service');

describe('M190', () => {
  test('should get all items', async () => {
    const result = await m190Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m190Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});