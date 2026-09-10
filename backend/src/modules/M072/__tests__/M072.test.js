const m072Service = require('../service');

describe('M072', () => {
  test('should get all items', async () => {
    const result = await m072Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m072Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});