const m156Service = require('../service');

describe('M156', () => {
  test('should get all items', async () => {
    const result = await m156Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m156Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});