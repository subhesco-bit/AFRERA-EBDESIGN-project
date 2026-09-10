const m312Service = require('../service');

describe('M312', () => {
  test('should get all items', async () => {
    const result = await m312Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m312Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});