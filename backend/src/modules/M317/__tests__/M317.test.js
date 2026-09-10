const m317Service = require('../service');

describe('M317', () => {
  test('should get all items', async () => {
    const result = await m317Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m317Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});