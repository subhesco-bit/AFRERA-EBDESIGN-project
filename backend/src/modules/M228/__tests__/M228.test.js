const m228Service = require('../service');

describe('M228', () => {
  test('should get all items', async () => {
    const result = await m228Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m228Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});