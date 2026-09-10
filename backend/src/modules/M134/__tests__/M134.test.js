const m134Service = require('../service');

describe('M134', () => {
  test('should get all items', async () => {
    const result = await m134Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m134Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});