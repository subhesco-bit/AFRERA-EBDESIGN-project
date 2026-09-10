const m269Service = require('../service');

describe('M269', () => {
  test('should get all items', async () => {
    const result = await m269Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m269Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});