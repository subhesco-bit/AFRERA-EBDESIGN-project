const m219Service = require('../service');

describe('M219', () => {
  test('should get all items', async () => {
    const result = await m219Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m219Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});