const m320Service = require('../service');

describe('M320', () => {
  test('should get all items', async () => {
    const result = await m320Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m320Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});