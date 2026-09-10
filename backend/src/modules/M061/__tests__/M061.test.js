const m061Service = require('../service');

describe('M061', () => {
  test('should get all items', async () => {
    const result = await m061Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m061Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});