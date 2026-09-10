const m303Service = require('../service');

describe('M303', () => {
  test('should get all items', async () => {
    const result = await m303Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m303Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});