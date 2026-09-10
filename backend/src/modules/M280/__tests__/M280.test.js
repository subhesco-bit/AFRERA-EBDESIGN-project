const m280Service = require('../service');

describe('M280', () => {
  test('should get all items', async () => {
    const result = await m280Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m280Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});