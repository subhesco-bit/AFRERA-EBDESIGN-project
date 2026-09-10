const m245Service = require('../service');

describe('M245', () => {
  test('should get all items', async () => {
    const result = await m245Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m245Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});