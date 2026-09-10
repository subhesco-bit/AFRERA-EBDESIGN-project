const m064Service = require('../service');

describe('M064', () => {
  test('should get all items', async () => {
    const result = await m064Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m064Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});