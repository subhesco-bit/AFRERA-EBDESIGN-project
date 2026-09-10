const m124Service = require('../service');

describe('M124', () => {
  test('should get all items', async () => {
    const result = await m124Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m124Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});