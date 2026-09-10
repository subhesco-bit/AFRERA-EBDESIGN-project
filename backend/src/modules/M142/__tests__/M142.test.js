const m142Service = require('../service');

describe('M142', () => {
  test('should get all items', async () => {
    const result = await m142Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m142Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});