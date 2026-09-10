const m047Service = require('../service');

describe('M047', () => {
  test('should get all items', async () => {
    const result = await m047Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m047Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});